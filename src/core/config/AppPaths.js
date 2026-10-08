import path from 'node:path';
import { homeDirectory } from '../platform/Platform.js';

export class AppPaths {
  constructor(dataRoot) {
    this.dataRoot = dataRoot;
  }

  static fromEnvironment(environment) {
    return new AppPaths(environment.CCT_HOME || path.join(homeDirectory, '.cct'));
  }

  get profilesDirectory() {
    return path.join(this.dataRoot, 'profiles');
  }

  get bindingsFile() {
    return path.join(this.dataRoot, 'bindings.json');
  }

  get backupsDirectory() {
    return path.join(this.dataRoot, 'backups');
  }

  profileDirectory(profileName) {
    return path.join(this.profilesDirectory, profileName);
  }
}
