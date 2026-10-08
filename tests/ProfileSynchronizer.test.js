import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { LinkState } from '../src/core/sharing/ClaudeItemLinker.js';
import { TemporaryWorkspace } from './support/TemporaryWorkspace.js';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

function replaceFileAtomically(file, content) {
  const temporaryFile = `${file}.replace`;
  fs.writeFileSync(temporaryFile, content);
  fs.renameSync(temporaryFile, file);
}

describe('ProfileSynchronizer', () => {
  const workspace = new TemporaryWorkspace();
  after(() => workspace.dispose());

  workspace.writeDefaultClaudeFile('settings.json', '{"permissions":{"allow":["Bash(ls)"]}}');
  workspace.writeDefaultClaudeFile('CLAUDE.md', '# global memory');
  workspace.writeDefaultClaudeFile('skills/review/SKILL.md', 'review skill');
  workspace.writeDefaultClaudeFile('projects/D--work-api/memory/MEMORY.md', 'folder memory');
  workspace.writeDefaultClaudeFile('.claude.json', JSON.stringify({
    oauthAccount: { emailAddress: 'me@company.com' },
    mcpServers: { docs: { type: 'http', url: 'https://docs.example' } },
    projects: { 'D:/work/api': { mcpServers: { db: { command: 'db-mcp' } }, hasTrustDialogAccepted: true, allowedTools: [] } },
  }));

  const personal = workspace.createProfile({ name: 'personal', toolIds: ['gh', 'git'], gitIdentity: { email: 'me@home.dev' } });
  const sandbox = workspace.createProfile({ name: 'sandbox', unsharedItems: ['settings.json', 'projects'] });
  const { synchronizer, linker } = workspace.services;

  it('shares skills, global memory and per-folder memory with the default profile', () => {
    assert.deepEqual(synchronizer.synchronize(personal), []);
    assert.equal(fs.readFileSync(workspace.profileClaudePath(personal, 'skills/review/SKILL.md'), 'utf8'), 'review skill');
    assert.equal(fs.readFileSync(workspace.profileClaudePath(personal, 'projects/D--work-api/memory/MEMORY.md'), 'utf8'), 'folder memory');
    assert.equal(linker.describe(personal, 'CLAUDE.md'), LinkState.SHARED);
    assert.equal(linker.describe(personal, 'settings.json'), LinkState.SHARED);
  });

  it('writes memory created inside a profile into the shared folder', () => {
    fs.writeFileSync(workspace.profileClaudePath(personal, 'projects/D--work-api/memory/new.md'), 'learned');
    assert.equal(fs.readFileSync(path.join(workspace.defaultClaudeDirectory, 'projects/D--work-api/memory/new.md'), 'utf8'), 'learned');
  });

  it('copies MCP servers and folder trust without the login state', () => {
    const state = readJson(workspace.profileClaudePath(personal, '.claude.json'));
    assert.deepEqual(Object.keys(state.mcpServers), ['docs']);
    assert.deepEqual(state.projects['D:/work/api'].mcpServers, { db: { command: 'db-mcp' } });
    assert.equal(state.projects['D:/work/api'].hasTrustDialogAccepted, true);
    assert.equal(state.oauthAccount, undefined);
  });

  it('re-links a shared file after an application replaced it', () => {
    const sharedSettings = path.join(workspace.defaultClaudeDirectory, 'settings.json');
    replaceFileAtomically(sharedSettings, '{"version":2}');
    synchronizer.synchronize(personal);
    assert.equal(linker.describe(personal, 'settings.json'), LinkState.SHARED);
    assert.equal(fs.readFileSync(workspace.profileClaudePath(personal, 'settings.json'), 'utf8'), '{"version":2}');
  });

  it('keeps the newer copy when the profile side replaced a shared file', () => {
    const profileSettings = workspace.profileClaudePath(personal, 'settings.json');
    const futureTime = new Date(Date.now() + 60_000);
    replaceFileAtomically(profileSettings, '{"version":3}');
    fs.utimesSync(profileSettings, futureTime, futureTime);
    synchronizer.synchronize(personal);
    assert.equal(fs.readFileSync(path.join(workspace.defaultClaudeDirectory, 'settings.json'), 'utf8'), '{"version":3}');
    assert.equal(linker.describe(personal, 'settings.json'), LinkState.SHARED);
  });

  it('gives an unshared settings file its own copy with the profile environment', () => {
    synchronizer.synchronize(sandbox);
    const settings = readJson(workspace.profileClaudePath(sandbox, 'settings.json'));
    assert.equal(linker.describe(sandbox, 'settings.json'), LinkState.SEPARATE);
    assert.equal(settings.version, 3);
    assert.equal(settings.env.CCT_PROFILE, 'sandbox');
    assert.equal(linker.describe(sandbox, 'projects'), LinkState.NOT_CREATED);
  });

  it('generates a gitconfig with the profile identity and the gh credential helper', () => {
    const generated = fs.readFileSync(workspace.services.directories.gitGeneratedConfigFile(personal), 'utf8');
    assert.match(generated, /email = "me@home\.dev"/);
    assert.match(generated, /\[credential "https:\/\/github\.com"\]\n\thelper =\n\thelper = .*auth git-credential/);
    assert.match(fs.readFileSync(workspace.services.directories.gitGlobalConfigFile(personal), 'utf8'), /path = gitconfig\.cct/);
  });

  it('releases the shared links before a profile is deleted', () => {
    linker.releaseAll(personal);
    workspace.services.profiles.delete(personal);
    assert.equal(fs.readFileSync(path.join(workspace.defaultClaudeDirectory, 'skills/review/SKILL.md'), 'utf8'), 'review skill');
    assert.equal(fs.existsSync(path.join(workspace.defaultClaudeDirectory, 'settings.json')), true);
  });
});
