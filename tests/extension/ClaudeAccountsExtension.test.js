import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { findExecutable } from '../../src/core/platform/ExecutableLocator.js';
import { TemporaryWorkspace } from '../support/TemporaryWorkspace.js';

const require = createRequire(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fakeVsCodePath = require.resolve('../support/FakeVsCode.cjs');
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveWithFakeVsCode(request, ...rest) {
  return request === 'vscode' ? fakeVsCodePath : originalResolveFilename.call(this, request, ...rest);
};
const vscode = require(fakeVsCodePath);
const { activate } = require('../../extension/src/extension.js');
const { fake } = vscode;

const manifest = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'extension', 'package.json'), 'utf8'));
const contributedCommandIds = manifest.contributes.commands.map(command => command.command);

describe('Claude Accounts extension', () => {
  const workspace = new TemporaryWorkspace();
  const projectFolder = workspace.createFolder('projects/side-project');
  const originalEnvironment = { CCT_HOME: process.env.CCT_HOME, CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR };
  let extension;

  before(() => {
    process.env.CLAUDE_CONFIG_DIR = workspace.defaultClaudeDirectory;
    delete process.env.CCT_HOME;
    workspace.writeDefaultClaudeFile('.claude.json', JSON.stringify({ oauthAccount: { emailAddress: 'me@company.com' } }));
  });

  after(() => {
    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    workspace.dispose();
  });

  beforeEach(async () => {
    fake.reset({ workspaceFolders: [projectFolder], configuration: { dataDirectory: workspace.environment.CCT_HOME } });
    extension = await activate({ subscriptions: [] });
  });

  const rootItems = () => fake.recorded.treeViews[0].treeDataProvider.getChildren();
  const statusBar = () => fake.recorded.statusBarItems[0];

  it('registers every command contributed in package.json', () => {
    assert.deepEqual([...fake.recorded.commands.keys()].sort(), [...contributedCommandIds].sort());
  });

  it('shows the default profile with its Claude account', () => {
    const [defaultItem] = rootItems();
    assert.equal(defaultItem.label, 'default');
    assert.equal(defaultItem.description, 'me@company.com');
    assert.equal(defaultItem.contextValue, 'cctProfileDefault');
    assert.equal(statusBar().text, '$(account) Claude: choose account');
  });

  it('creates a profile through the wizard', async () => {
    fake.scriptedAnswers.inputBoxes.push('personal', 'Jane Doe', 'jane@home.dev', 'Personal plan');
    fake.scriptedAnswers.quickPicks.push(items => items.filter(item => ['gh', 'git'].includes(item.toolId)));
    await vscode.commands.executeCommand('cct.addProfile');

    const profile = extension.services.profiles.get('personal');
    assert.deepEqual(profile.toolIds, ['gh', 'git']);
    assert.equal(profile.gitIdentity.email, 'jane@home.dev');
    assert.equal(profile.description, 'Personal plan');
    assert.deepEqual(rootItems().map(item => item.label), ['default', 'personal']);
    assert.deepEqual(fake.recorded.errorMessages, []);
  });

  it('binds the workspace folder and shows it in the tree and status bar', async () => {
    await vscode.commands.executeCommand('cct.bindWorkspaceFolder', 'personal');
    const personalItem = rootItems().find(item => item.label === 'personal');
    assert.match(personalItem.description, /this folder/);
    assert.match(statusBar().text, /\$\(account\) personal/);

    const details = fake.recorded.treeViews[0].treeDataProvider.getChildren(personalItem);
    const folderDetail = details.find(item => item.contextValue === 'cctBoundFolder');
    assert.equal(folderDetail.folderPath, extension.services.bindings.closestTo(projectFolder).path);
    assert.equal(details.find(item => item.label === 'Claude').command.command, 'cct.login');
  });

  it('starts Claude for the folder in a terminal with the profile environment', async t => {
    if (!findExecutable('claude')) return t.skip('claude is not on PATH');
    await vscode.commands.executeCommand('cct.launchClaudeForWorkspace');
    const [terminal] = fake.recorded.terminals;
    const profile = extension.services.profiles.get('personal');
    assert.equal(terminal.options.name, 'Claude · personal');
    assert.equal(terminal.options.env.CLAUDE_CONFIG_DIR, extension.services.directories.claudeConfigDirectory(profile));
    assert.equal(terminal.options.env.CCT_PROFILE, 'personal');
    assert.equal(terminal.options.cwd, projectFolder);
    assert.equal(terminal.shown, true);
  });

  it('lists the connectable services of a profile with their sign-in state', () => {
    workspace.writeDefaultClaudeFile('.claude.json', JSON.stringify({
      oauthAccount: { emailAddress: 'me@company.com' },
      mcpServers: { clickup: { type: 'http', url: 'https://mcp.clickup.com/mcp' } },
    }));
    const provider = fake.recorded.treeViews[0].treeDataProvider;
    const personalItem = rootItems().find(item => item.label === 'personal');
    const connectionsGroup = provider.getChildren(personalItem).find(item => item.label === 'Connections');
    const connections = provider.getChildren(connectionsGroup);

    assert.match(connectionsGroup.description, /^0\/\d+ connected$/);
    assert.deepEqual(connections.slice(0, 3).map(item => item.label), ['ClickUp', 'Notion', 'Slack']);
    assert.equal(connections[0].description, 'not connected');
    assert.equal(connections[1].description, 'not added');
    assert.equal(connections[0].contextValue, 'cctConnectionAvailable');
    assert.equal(connections[0].command.command, 'cct.connectService');
  });

  it('starts Claude as the profile with sign-in instructions when connecting an added service', async t => {
    if (!findExecutable('claude')) return t.skip('claude is not on PATH');
    await vscode.commands.executeCommand('cct.connectService', { profileName: 'personal', serverId: 'clickup' });
    const [terminal] = fake.recorded.terminals;
    assert.equal(terminal.options.name, 'Claude · personal');
    assert.match(terminal.options.message, /Type \/mcp, choose "clickup" and pick Authenticate/);
    assert.deepEqual(fake.recorded.errorMessages, []);
  });

  it('stores a Railway token pasted for a profile and shows it in the tree', async () => {
    const profile = extension.services.profiles.get('personal');
    extension.services.profiles.save(new extension.core.Profile({ ...profile, toolIds: [...profile.toolIds, 'railway'] }));
    fake.scriptedAnswers.messages.push('Paste Token');
    fake.scriptedAnswers.inputBoxes.push('railway-secret');

    await vscode.commands.executeCommand('cct.login', 'personal', 'railway');

    const environment = extension.services.environmentBuilder.processEnvironmentFor(extension.services.profiles.get('personal'));
    assert.equal(environment.RAILWAY_API_TOKEN, 'railway-secret');
    const personalItem = rootItems().find(item => item.label === 'personal');
    const railwayRow = fake.recorded.treeViews[0].treeDataProvider.getChildren(personalItem).find(item => item.label === 'Railway');
    assert.equal(railwayRow.description, 'token saved');
    assert.deepEqual(fake.recorded.errorMessages, []);
  });

  it('unbinds a folder from its tree item', async () => {
    const boundFolder = extension.services.bindings.closestTo(projectFolder).path;
    await vscode.commands.executeCommand('cct.unbindFolder', { folderPath: boundFolder });
    assert.equal(extension.services.bindings.closestTo(projectFolder), null);
  });

  it('removes a profile only after the modal confirmation', async () => {
    fake.scriptedAnswers.messages.push(undefined);
    await vscode.commands.executeCommand('cct.removeProfile', 'personal');
    assert.equal(extension.services.profiles.exists('personal'), true);

    fake.scriptedAnswers.messages.push('Remove');
    await vscode.commands.executeCommand('cct.removeProfile', 'personal');
    assert.equal(extension.services.profiles.exists('personal'), false);
    assert.equal(fs.existsSync(path.join(workspace.defaultClaudeDirectory, '.claude.json')), true);
  });
});
