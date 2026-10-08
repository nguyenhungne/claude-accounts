import { isFile, readJsonFile, writeJsonFile } from '../fileSystem/FileSystem.js';
import { Profile } from '../profiles/Profile.js';

const PROJECT_SERVER_LIST_KEYS = ['enabledMcpjsonServers', 'disabledMcpjsonServers'];

export class McpConfigurationSynchronizer {
  constructor(directories) {
    this.directories = directories;
  }

  synchronize(profile) {
    const defaultState = readJsonFile(this.directories.claudeStateFile(Profile.createDefault()), { tolerateInvalid: true });
    if (!defaultState) return;

    const profileStateFile = this.directories.claudeStateFile(profile);
    const profileState = readJsonFile(profileStateFile, { tolerateInvalid: true });
    if (!profileState && isFile(profileStateFile)) return;

    const mergedState = profileState ?? {};
    const stateBeforeMerge = JSON.stringify(mergedState);
    if (defaultState.mcpServers) mergedState.mcpServers = { ...mergedState.mcpServers, ...defaultState.mcpServers };
    for (const [projectPath, defaultProject] of Object.entries(defaultState.projects ?? {})) {
      this.#mergeProject(mergedState, projectPath, defaultProject);
    }
    if (JSON.stringify(mergedState) !== stateBeforeMerge) writeJsonFile(profileStateFile, mergedState);
  }

  #mergeProject(profileState, projectPath, defaultProject) {
    const hasServers = Object.keys(defaultProject.mcpServers ?? {}).length > 0;
    const listKeysToMerge = PROJECT_SERVER_LIST_KEYS.filter(key => defaultProject[key]?.length);
    const isTrusted = defaultProject.hasTrustDialogAccepted === true;
    if (!hasServers && listKeysToMerge.length === 0 && !isTrusted) return;

    profileState.projects ??= {};
    const project = (profileState.projects[projectPath] ??= {});
    if (hasServers) project.mcpServers = { ...project.mcpServers, ...defaultProject.mcpServers };
    for (const key of listKeysToMerge) project[key] = [...new Set([...(project[key] ?? []), ...defaultProject[key]])];
    if (isTrusted) project.hasTrustDialogAccepted = true;
  }
}
