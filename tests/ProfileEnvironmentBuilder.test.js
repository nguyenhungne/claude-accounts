import assert from 'node:assert/strict';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { Profile } from '../src/core/profiles/Profile.js';
import { TemporaryWorkspace } from './support/TemporaryWorkspace.js';

describe('ProfileEnvironmentBuilder', () => {
  const workspace = new TemporaryWorkspace({ extraEnvironment: { KUBECONFIG: '/home/me/.kube/config' } });
  after(() => workspace.dispose());

  const personal = workspace.createProfile({ name: 'personal', toolIds: ['gh', 'git'], environment: { ANTHROPIC_MODEL: 'opus' } });
  const lab = workspace.createProfile({ name: 'lab', toolIds: [] });

  it('points Claude and every isolated tool at the profile folder', () => {
    const variables = workspace.services.environmentBuilder.variablesOwnedBy(personal);
    const profileRoot = workspace.services.directories.rootOf(personal);
    assert.equal(variables.CLAUDE_CONFIG_DIR, path.join(profileRoot, 'claude'));
    assert.equal(variables.GH_CONFIG_DIR, path.join(profileRoot, 'gh'));
    assert.equal(variables.GIT_CONFIG_GLOBAL, path.join(profileRoot, 'gitconfig'));
    assert.equal(variables.ANTHROPIC_MODEL, 'opus');
    assert.equal(variables.AZURE_CONFIG_DIR, undefined);
  });

  it('keeps the original value of tools the profile does not isolate', () => {
    const environment = workspace.services.environmentBuilder.processEnvironmentFor(personal);
    assert.equal(environment.KUBECONFIG, '/home/me/.kube/config');
    assert.equal(environment.CCT_PROFILE, 'personal');
  });

  it('does not leak variables of the active profile into the next one', () => {
    const insidePersonal = workspace.services.environmentBuilder.processEnvironmentFor(personal);
    const servicesInsidePersonal = workspace.withEnvironment(insidePersonal);
    const labEnvironment = servicesInsidePersonal.environmentBuilder.processEnvironmentFor(lab);
    assert.equal(labEnvironment.GH_CONFIG_DIR, undefined);
    assert.equal(labEnvironment.GIT_CONFIG_GLOBAL, undefined);
    assert.equal(labEnvironment.ANTHROPIC_MODEL, undefined);
    assert.equal(labEnvironment.KUBECONFIG, '/home/me/.kube/config');
    assert.equal(labEnvironment.CCT_PROFILE, 'lab');
  });

  it('restores the original environment on reset', () => {
    const insidePersonal = workspace.services.environmentBuilder.processEnvironmentFor(personal);
    const reset = workspace.withEnvironment(insidePersonal).environmentBuilder.resetAssignments();
    assert.equal(reset.CLAUDE_CONFIG_DIR, workspace.defaultClaudeDirectory);
    assert.equal(reset.GH_CONFIG_DIR, null);
    assert.equal(reset.ANTHROPIC_MODEL, null);
    assert.equal(reset.CCT_PROFILE, null);
  });

  it('gives the default profile an unchanged environment', () => {
    const environment = workspace.services.environmentBuilder.processEnvironmentFor(Profile.createDefault());
    assert.equal(environment.CLAUDE_CONFIG_DIR, workspace.defaultClaudeDirectory);
    assert.equal(environment.GH_CONFIG_DIR, undefined);
  });
});
