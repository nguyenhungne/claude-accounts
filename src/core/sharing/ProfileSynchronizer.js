import path from 'node:path';
import { ensureDirectory } from '../fileSystem/FileSystem.js';
import { ISOLATED_TOOLS } from '../tools/IsolatedTools.js';
import { MCP_ITEM_NAME, SETTINGS_FILE_NAME, SHARED_CLAUDE_DIRECTORIES, SHARED_CLAUDE_FILES } from './SharedClaudeItems.js';

export class ProfileSynchronizer {
  constructor({ directories, environmentBuilder, linker, mcpSynchronizer, settingsWriter, gitConfigWriter }) {
    this.directories = directories;
    this.environmentBuilder = environmentBuilder;
    this.linker = linker;
    this.mcpSynchronizer = mcpSynchronizer;
    this.settingsWriter = settingsWriter;
    this.gitConfigWriter = gitConfigWriter;
  }

  synchronize(profile) {
    if (profile.isDefault) return [];
    const warnings = [];
    const attempt = (label, action) => {
      try {
        action();
      } catch (error) {
        warnings.push(`${label}: ${error.message}`);
      }
    };

    ensureDirectory(this.directories.claudeConfigDirectory(profile));
    this.#createToolDirectories(profile);
    if (profile.isolates('git')) attempt('gitconfig', () => this.gitConfigWriter.write(profile));

    for (const directoryName of SHARED_CLAUDE_DIRECTORIES) {
      attempt(directoryName, () => (profile.sharesClaudeItem(directoryName)
        ? this.linker.shareDirectory(profile, directoryName)
        : this.linker.makeSeparate(profile, directoryName)));
    }
    for (const sharedFile of SHARED_CLAUDE_FILES) {
      attempt(sharedFile.name, () => (profile.sharesClaudeItem(sharedFile.name)
        ? this.linker.shareFile(profile, sharedFile)
        : this.linker.makeSeparate(profile, sharedFile.name)));
    }

    if (!profile.sharesClaudeItem(SETTINGS_FILE_NAME)) {
      attempt(SETTINGS_FILE_NAME, () => this.settingsWriter.write(profile, this.environmentBuilder.variablesOwnedBy(profile)));
    }
    if (profile.sharesClaudeItem(MCP_ITEM_NAME)) attempt(MCP_ITEM_NAME, () => this.mcpSynchronizer.synchronize(profile));
    return warnings;
  }

  #createToolDirectories(profile) {
    const profileRoot = this.directories.rootOf(profile);
    for (const tool of ISOLATED_TOOLS) {
      if (!profile.isolates(tool.id)) continue;
      for (const directoryName of tool.directories) ensureDirectory(path.join(profileRoot, directoryName));
    }
  }
}
