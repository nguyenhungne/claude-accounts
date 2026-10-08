import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, describe, it } from 'node:test';
import { CctError } from '../src/core/errors/CctError.js';
import { Profile } from '../src/core/profiles/Profile.js';
import { TemporaryWorkspace } from './support/TemporaryWorkspace.js';

describe('token login tools (Railway, Heroku)', () => {
  const workspace = new TemporaryWorkspace({ extraEnvironment: { HEROKU_API_KEY: 'key-from-the-shell' } });
  after(() => workspace.dispose());

  const deploy = workspace.createProfile({ name: 'deploy', toolIds: ['railway', 'heroku'] });
  const { environmentBuilder, loginPlanner, overview, toolTokens } = workspace.services;

  it('passes each saved token through its own environment variable', () => {
    toolTokens.save(deploy, 'railway', '  railway-secret \n');
    toolTokens.save(deploy, 'heroku', 'heroku-secret');

    const environment = environmentBuilder.processEnvironmentFor(deploy);

    assert.equal(environment.RAILWAY_API_TOKEN, 'railway-secret');
    assert.equal(environment.HEROKU_API_KEY, 'heroku-secret');
  });

  it('does not leak a profile token into the default profile', () => {
    const insideDeploy = environmentBuilder.processEnvironmentFor(deploy);
    const defaultEnvironment = workspace.withEnvironment(insideDeploy).environmentBuilder.processEnvironmentFor(Profile.createDefault());

    assert.equal(defaultEnvironment.RAILWAY_API_TOKEN, undefined);
    assert.equal(defaultEnvironment.HEROKU_API_KEY, 'key-from-the-shell');
  });

  it('plans a token login for a profile and the normal browser login for the default profile', () => {
    const profilePlan = loginPlanner.plan(deploy, 'railway');
    assert.equal(profilePlan.kind, 'token');
    assert.equal(profilePlan.environmentVariable, 'RAILWAY_API_TOKEN');
    assert.equal(profilePlan.createTokenUrl, 'https://railway.com/account/tokens');

    assert.deepEqual(loginPlanner.availableTargets(deploy).map(({ id }) => id), ['claude', 'railway', 'heroku']);
  });

  it('shows which token logins a profile has', () => {
    toolTokens.remove(deploy, 'heroku');
    const deployOverview = overview.describe(deploy);
    assert.deepEqual(deployOverview.tokenLogins, [
      { toolId: 'railway', displayName: 'Railway CLI', hasToken: true },
      { toolId: 'heroku', displayName: 'Heroku CLI', hasToken: false },
    ]);
    assert.deepEqual(overview.describe(Profile.createDefault()).tokenLogins, []);
  });

  it('keeps tokens readable by the owner only and refuses to store one for the default profile', () => {
    const tokenFile = toolTokens.save(deploy, 'heroku', 'again');
    if (process.platform !== 'win32') assert.equal(fs.statSync(tokenFile).mode & 0o777, 0o600);
    assert.throws(() => toolTokens.save(Profile.createDefault(), 'railway', 'x'), CctError);
    assert.throws(() => toolTokens.save(deploy, 'railway', '   '), CctError);
  });
});

describe('ProfileLifecycle.changeTools', () => {
  const workspace = new TemporaryWorkspace();
  after(() => workspace.dispose());

  it('saves the new separate CLIs and creates their folders', () => {
    const profile = workspace.createProfile({ name: 'existing', toolIds: ['gh', 'git'] });
    const { profile: updated } = workspace.services.lifecycle.changeTools(profile, ['gh', 'git', 'railway']);
    assert.deepEqual(workspace.services.profiles.get('existing').toolIds, ['gh', 'git', 'railway']);
    assert.equal(fs.existsSync(`${workspace.services.directories.rootOf(updated)}/railway`), true);
    assert.throws(() => workspace.services.lifecycle.changeTools(profile, ['nope']), CctError);
  });
});
