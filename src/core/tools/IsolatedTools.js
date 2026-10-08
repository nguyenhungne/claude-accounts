import path from 'node:path';
import { readToolToken } from './ToolTokenStore.js';

class IsolatedTool {
  constructor({
    id,
    displayName,
    executableName = null,
    directories = [],
    environmentFor,
    environmentVariableNames = null,
    loginArgumentsFor = null,
    loginNoticeFor = null,
    tokenLogin = null,
  }) {
    this.id = id;
    this.displayName = displayName;
    this.executableName = executableName;
    this.directories = directories;
    this.environmentFor = environmentFor;
    this.explicitEnvironmentVariableNames = environmentVariableNames;
    this.loginArgumentsFor = loginArgumentsFor;
    this.loginNoticeFor = loginNoticeFor ?? (() => null);
    this.tokenLogin = tokenLogin;
  }

  get environmentVariableNames() {
    return this.explicitEnvironmentVariableNames ?? Object.keys(this.environmentFor(''));
  }

  get supportsLogin() {
    return this.loginArgumentsFor !== null || this.tokenLogin !== null;
  }

  usesTokenLoginFor(profile) {
    return this.tokenLogin !== null && !profile.isDefault;
  }
}

const tokenTool = ({ id, displayName, environmentVariable, createTokenUrl, tokenLabel }) => new IsolatedTool({
  id,
  displayName,
  executableName: id,
  directories: [id],
  environmentVariableNames: [environmentVariable],
  environmentFor: profileRoot => {
    const token = readToolToken(profileRoot, id);
    return token ? { [environmentVariable]: token } : {};
  },
  loginArgumentsFor: () => ['login'],
  tokenLogin: { environmentVariable, createTokenUrl, tokenLabel },
});

export const ISOLATED_TOOLS = Object.freeze([
  new IsolatedTool({
    id: 'gh',
    displayName: 'GitHub CLI',
    executableName: 'gh',
    directories: ['gh'],
    environmentFor: profileRoot => ({ GH_CONFIG_DIR: path.join(profileRoot, 'gh') }),
    loginArgumentsFor: profile => (profile.isDefault ? ['auth', 'login'] : ['auth', 'login', '--insecure-storage']),
    loginNoticeFor: profile => (profile.isDefault
      ? null
      : 'the token is stored in the profile folder, because the OS keychain entry of gh is shared by every config dir'),
  }),
  new IsolatedTool({
    id: 'git',
    displayName: 'git',
    environmentFor: profileRoot => ({ GIT_CONFIG_GLOBAL: path.join(profileRoot, 'gitconfig') }),
  }),
  new IsolatedTool({
    id: 'azure',
    displayName: 'Azure CLI',
    executableName: 'az',
    directories: ['azure'],
    environmentFor: profileRoot => ({ AZURE_CONFIG_DIR: path.join(profileRoot, 'azure') }),
    loginArgumentsFor: () => ['login'],
  }),
  new IsolatedTool({
    id: 'kube',
    displayName: 'kubectl',
    directories: ['kube'],
    environmentFor: profileRoot => ({ KUBECONFIG: path.join(profileRoot, 'kube', 'config') }),
  }),
  new IsolatedTool({
    id: 'npm',
    displayName: 'npm',
    environmentFor: profileRoot => ({ NPM_CONFIG_USERCONFIG: path.join(profileRoot, 'npmrc') }),
  }),
  tokenTool({
    id: 'railway',
    displayName: 'Railway CLI',
    environmentVariable: 'RAILWAY_API_TOKEN',
    createTokenUrl: 'https://railway.com/account/tokens',
    tokenLabel: 'Railway account token',
  }),
  tokenTool({
    id: 'heroku',
    displayName: 'Heroku CLI',
    environmentVariable: 'HEROKU_API_KEY',
    createTokenUrl: 'https://dashboard.heroku.com/account/applications',
    tokenLabel: 'Heroku API key or authorization token',
  }),
  new IsolatedTool({
    id: 'aws',
    displayName: 'AWS CLI',
    directories: ['aws'],
    environmentFor: profileRoot => ({
      AWS_CONFIG_FILE: path.join(profileRoot, 'aws', 'config'),
      AWS_SHARED_CREDENTIALS_FILE: path.join(profileRoot, 'aws', 'credentials'),
    }),
  }),
]);

export const ISOLATED_TOOL_IDS = ISOLATED_TOOLS.map(tool => tool.id);
export const DEFAULT_ISOLATED_TOOL_IDS = ['gh', 'git'];

export function findIsolatedTool(toolId) {
  return ISOLATED_TOOLS.find(tool => tool.id === toolId) ?? null;
}
