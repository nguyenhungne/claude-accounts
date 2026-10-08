import os from 'node:os';
import path from 'node:path';

export const isWindows = process.platform === 'win32';
export const isMac = process.platform === 'darwin';
export const homeDirectory = os.homedir();
export const pathsAreCaseInsensitive = isWindows || isMac;

export function configHomeDirectory() {
  return process.env.XDG_CONFIG_HOME || path.join(homeDirectory, '.config');
}

export function defaultGithubCliConfigDirectory() {
  if (isWindows) return path.join(process.env.APPDATA || homeDirectory, 'GitHub CLI');
  return path.join(configHomeDirectory(), 'gh');
}
