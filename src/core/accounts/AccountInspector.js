import fs from 'node:fs';
import path from 'node:path';
import { isFile } from '../fileSystem/FileSystem.js';
import { findExecutable } from '../platform/ExecutableLocator.js';
import { runCaptured } from '../platform/ProcessRunner.js';

const CLAUDE_EMAIL_PATTERN = /"oauthAccount"\s*:\s*\{[^}]*?"emailAddress"\s*:\s*"([^"]+)"/;
const CLAUDE_ORGANIZATION_PATTERN = /"oauthAccount"\s*:\s*\{[^}]*?"organizationName"\s*:\s*"([^"]+)"/;
const GITHUB_USER_PATTERN = /^github\.com:[\s\S]*?^\s+user:\s*(\S+)/m;
export const LOGGED_IN_WITHOUT_EMAIL = '(logged in)';

export class AccountInspector {
  constructor(directories) {
    this.directories = directories;
  }

  claudeAccount(profile) {
    const stateFile = this.directories.claudeStateFile(profile);
    if (isFile(stateFile)) {
      const state = fs.readFileSync(stateFile, 'utf8');
      const email = CLAUDE_EMAIL_PATTERN.exec(state)?.[1];
      if (email) {
        const organization = CLAUDE_ORGANIZATION_PATTERN.exec(state)?.[1];
        return organization && !organization.startsWith(email) ? `${email} [${organization}]` : email;
      }
    }
    const credentialsFile = path.join(this.directories.claudeConfigDirectory(profile), '.credentials.json');
    return isFile(credentialsFile) ? LOGGED_IN_WITHOUT_EMAIL : null;
  }

  githubUser(profile) {
    const hostsFile = path.join(this.directories.githubCliConfigDirectory(profile), 'hosts.yml');
    if (!isFile(hostsFile)) return null;
    return GITHUB_USER_PATTERN.exec(fs.readFileSync(hostsFile, 'utf8'))?.[1] ?? null;
  }

  gitEmail(profile) {
    const git = findExecutable('git');
    const configFile = this.directories.gitGlobalConfigFile(profile);
    if (!git || !isFile(configFile)) return null;
    const result = runCaptured(git, ['config', '--file', configFile, '--includes', '--get', 'user.email']);
    return result.exitCode === 0 && result.output ? result.output : null;
  }
}
