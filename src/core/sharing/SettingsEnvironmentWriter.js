import fs from 'node:fs';
import path from 'node:path';
import { isFile, readJsonFile, tryLstat, writeJsonFile } from '../fileSystem/FileSystem.js';
import {
  ACTIVE_PROFILE_VARIABLE,
  BOOKKEEPING_VARIABLES,
  CLAUDE_CONFIG_VARIABLE,
  MANAGED_VARIABLES,
} from '../environment/EnvironmentVariables.js';
import { SETTINGS_FILE_NAME } from './SharedClaudeItems.js';

const isCctVariable = name => MANAGED_VARIABLES.includes(name) || BOOKKEEPING_VARIABLES.includes(name);

export class SettingsEnvironmentWriter {
  constructor(directories) {
    this.directories = directories;
  }

  write(profile, ownedVariables) {
    const settingsFile = path.join(this.directories.claudeConfigDirectory(profile), SETTINGS_FILE_NAME);
    const defaultSettingsFile = path.join(this.directories.defaultClaudeConfigDirectory(), SETTINGS_FILE_NAME);
    if (!tryLstat(settingsFile) && isFile(defaultSettingsFile)) fs.copyFileSync(defaultSettingsFile, settingsFile);

    const settings = readJsonFile(settingsFile) ?? {};
    const settingsBefore = JSON.stringify(settings);
    const userVariables = Object.entries(settings.env ?? {}).filter(([name]) => !isCctVariable(name));
    const profileVariables = Object.entries(ownedVariables).filter(([name]) => name !== CLAUDE_CONFIG_VARIABLE);
    settings.env = {
      ...Object.fromEntries(userVariables),
      ...Object.fromEntries(profileVariables),
      [ACTIVE_PROFILE_VARIABLE]: profile.name,
    };
    if (JSON.stringify(settings) !== settingsBefore) writeJsonFile(settingsFile, settings);
  }
}
