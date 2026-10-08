import path from 'node:path';
import { CLAUDE_CONFIG_VARIABLE } from '../environment/EnvironmentVariables.js';
import { defaultGithubCliConfigDirectory, homeDirectory } from '../platform/Platform.js';
import { findIsolatedTool } from '../tools/IsolatedTools.js';

export class ProfileDirectories {
  constructor(appPaths, environmentBaseline) {
    this.appPaths = appPaths;
    this.environmentBaseline = environmentBaseline;
  }

  rootOf(profile) {
    return this.appPaths.profileDirectory(profile.name);
  }

  defaultClaudeConfigDirectory() {
    return this.environmentBaseline.originalValue(CLAUDE_CONFIG_VARIABLE) || path.join(homeDirectory, '.claude');
  }

  claudeConfigDirectory(profile) {
    return profile.isDefault ? this.defaultClaudeConfigDirectory() : path.join(this.rootOf(profile), 'claude');
  }

  claudeStateFile(profile) {
    if (!profile.isDefault) return path.join(this.claudeConfigDirectory(profile), '.claude.json');
    const customDefaultDirectory = this.environmentBaseline.originalValue(CLAUDE_CONFIG_VARIABLE);
    return customDefaultDirectory
      ? path.join(customDefaultDirectory, '.claude.json')
      : path.join(homeDirectory, '.claude.json');
  }

  githubCliConfigDirectory(profile) {
    if (profile.isolates('gh')) return findIsolatedTool('gh').environmentFor(this.rootOf(profile)).GH_CONFIG_DIR;
    return this.environmentBaseline.originalValue('GH_CONFIG_DIR') || defaultGithubCliConfigDirectory();
  }

  gitGlobalConfigFile(profile) {
    if (profile.isolates('git')) return findIsolatedTool('git').environmentFor(this.rootOf(profile)).GIT_CONFIG_GLOBAL;
    return this.environmentBaseline.originalValue('GIT_CONFIG_GLOBAL') || path.join(homeDirectory, '.gitconfig');
  }

  gitGeneratedConfigFile(profile) {
    return path.join(this.rootOf(profile), 'gitconfig.cct');
  }

  editorUserDataDirectory(profile, editorFlavorId) {
    return path.join(this.rootOf(profile), 'editors', editorFlavorId);
  }
}
