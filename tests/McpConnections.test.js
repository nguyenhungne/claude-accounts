import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { CctError } from '../src/core/errors/CctError.js';
import { McpConnectionState } from '../src/core/mcp/McpConnectionInspector.js';
import { findMcpServer } from '../src/core/mcp/McpServerCatalog.js';
import { McpServerInstaller } from '../src/core/mcp/McpServerInstaller.js';
import { isMac } from '../src/core/platform/Platform.js';
import { Profile } from '../src/core/profiles/Profile.js';
import { TemporaryWorkspace } from './support/TemporaryWorkspace.js';

const stateOf = (connections, serverId) => connections.find(({ server }) => server.id === serverId);

describe('McpConnectionInspector', () => {
  const workspace = new TemporaryWorkspace();
  after(() => workspace.dispose());

  workspace.writeDefaultClaudeFile('.claude.json', JSON.stringify({
    mcpServers: {
      notion: { type: 'http', url: 'https://mcp.notion.com/mcp' },
      'team-slack': { type: 'http', url: 'https://mcp.slack.com/mcp' },
    },
  }));
  const personal = workspace.createProfile({ name: 'personal' });
  const isolated = workspace.createProfile({ name: 'isolated', unsharedItems: ['mcp'] });
  workspace.services.synchronizer.synchronize(personal);
  const credentialsFile = workspace.profileClaudePath(personal, '.credentials.json');
  fs.writeFileSync(credentialsFile, JSON.stringify({
    claudeAiOauth: { accessToken: 'claude-token' },
    mcpOAuth: { 'notion|0123456789abcdef': { serverName: 'notion', accessToken: 'notion-token' } },
  }));

  it('reports a shared server the profile has signed in to as connected', () => {
    const connections = workspace.services.mcpConnections.describeAll(personal);
    assert.equal(stateOf(connections, 'notion').state, McpConnectionState.CONNECTED);
    assert.equal(stateOf(connections, 'clickup').state, McpConnectionState.NOT_ADDED);
  });

  it('recognises a catalog server added under another name by its URL', () => {
    const slack = stateOf(workspace.services.mcpConnections.describeAll(personal), 'slack');
    assert.equal(slack.configuredName, 'team-slack');
    assert.equal(slack.state, McpConnectionState.NOT_CONNECTED);
  });

  it('treats a missing credentials file as signed out, except on macOS where tokens live in the Keychain', () => {
    const connections = workspace.services.mcpConnections.describeAll(Profile.createDefault());
    const expected = isMac ? McpConnectionState.UNKNOWN : McpConnectionState.NOT_CONNECTED;
    assert.equal(stateOf(connections, 'notion').state, expected);
  });

  it('ignores default servers for a profile that keeps its MCP servers separate', () => {
    const connections = workspace.services.mcpConnections.describeAll(isolated);
    assert.equal(stateOf(connections, 'notion').state, McpConnectionState.NOT_ADDED);
  });
});

describe('McpServerInstaller', () => {
  const workspace = new TemporaryWorkspace();
  after(() => workspace.dispose());

  const sharing = workspace.createProfile({ name: 'sharing' });
  const isolated = workspace.createProfile({ name: 'isolated', unsharedItems: ['mcp'] });
  const calls = [];
  const installerReturning = exitCode => new McpServerInstaller({
    environmentBuilder: workspace.services.environmentBuilder,
    locateClaude: () => 'claude',
    runCommand: (executable, args, { environment }) => {
      calls.push({ executable, args, configDirectory: environment.CLAUDE_CONFIG_DIR });
      return { exitCode, output: '', errorOutput: exitCode === 0 ? '' : 'already exists' };
    },
  });

  it('adds the server once for the default profile when the profile shares MCP servers', () => {
    const owner = installerReturning(0).add(sharing, findMcpServer('clickup'));
    assert.equal(owner.isDefault, true);
    assert.deepEqual(calls.at(-1), {
      executable: 'claude',
      args: ['mcp', 'add', '--transport', 'http', '--scope', 'user', 'clickup', 'https://mcp.clickup.com/mcp'],
      configDirectory: workspace.defaultClaudeDirectory,
    });
  });

  it('adds the server to the profile itself when it keeps MCP servers separate', () => {
    installerReturning(0).add(isolated, findMcpServer('notion'));
    assert.equal(calls.at(-1).configDirectory, path.join(workspace.services.directories.rootOf(isolated), 'claude'));
  });

  it('reports what claude printed when adding fails', () => {
    assert.throws(() => installerReturning(1).add(sharing, findMcpServer('slack')), (error) =>
      error instanceof CctError && /already exists/.test(error.message));
  });
});
