import assert from 'node:assert/strict';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { TemporaryWorkspace } from './support/TemporaryWorkspace.js';

describe('ProfileResolver', () => {
  const workspace = new TemporaryWorkspace();
  after(() => workspace.dispose());

  workspace.createProfile({ name: 'work' });
  workspace.createProfile({ name: 'personal' });
  const workFolder = workspace.createFolder('code/work');
  const openSourceFolder = workspace.createFolder('code/work/open-source');
  const nestedFolder = workspace.createFolder('code/work/open-source/repo/src');
  const unboundFolder = workspace.createFolder('elsewhere');
  workspace.services.bindings.bind(workFolder, 'work');
  workspace.services.bindings.bind(openSourceFolder, 'personal');

  it('uses the closest bound parent folder', () => {
    assert.equal(workspace.services.resolver.resolve(nestedFolder).profileName, 'personal');
    assert.equal(workspace.services.resolver.resolve(path.join(workFolder)).profileName, 'work');
  });

  it('returns nothing outside every binding', () => {
    assert.equal(workspace.services.resolver.resolve(unboundFolder), null);
  });

  it('prefers the profile that is active in the shell', () => {
    const services = workspace.withEnvironment({ CCT_PROFILE: 'work' });
    const resolution = services.resolver.resolve(nestedFolder);
    assert.equal(resolution.profileName, 'work');
    assert.equal(resolution.reason, 'active in this shell');
  });

  it('forgets bindings of a removed profile', () => {
    workspace.services.bindings.removeProfile('personal');
    assert.equal(workspace.services.resolver.resolve(nestedFolder).profileName, 'work');
  });
});
