import path from 'node:path';
import { findExecutable } from '../platform/ExecutableLocator.js';
import { configHomeDirectory, homeDirectory, isMac, isWindows } from '../platform/Platform.js';

function applicationDataDirectory(folderName) {
  if (isWindows) return path.join(process.env.APPDATA || homeDirectory, folderName);
  if (isMac) return path.join(homeDirectory, 'Library', 'Application Support', folderName);
  return path.join(configHomeDirectory(), folderName);
}

class EditorFlavor {
  constructor({ id, displayName, cliName, settingsFolderName, extensionsFolderName, windowsCliDirectories, macCliDirectories }) {
    this.id = id;
    this.displayName = displayName;
    this.cliName = cliName;
    this.settingsFolderName = settingsFolderName;
    this.extensionsFolderName = extensionsFolderName;
    this.windowsCliDirectories = windowsCliDirectories;
    this.macCliDirectories = macCliDirectories;
  }

  get userDirectory() {
    return path.join(applicationDataDirectory(this.settingsFolderName), 'User');
  }

  get extensionsDirectory() {
    return path.join(homeDirectory, this.extensionsFolderName, 'extensions');
  }

  get knownCliDirectories() {
    if (isWindows) return this.windowsCliDirectories();
    if (isMac) return this.macCliDirectories;
    return [];
  }

  locateCli() {
    return findExecutable(this.cliName, this.knownCliDirectories);
  }
}

export const EDITOR_FLAVORS = Object.freeze([
  new EditorFlavor({
    id: 'code',
    displayName: 'VS Code',
    cliName: 'code',
    settingsFolderName: 'Code',
    extensionsFolderName: '.vscode',
    windowsCliDirectories: () => [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'bin'),
      path.join(process.env.ProgramFiles || '', 'Microsoft VS Code', 'bin'),
    ],
    macCliDirectories: ['/Applications/Visual Studio Code.app/Contents/Resources/app/bin'],
  }),
  new EditorFlavor({
    id: 'cursor',
    displayName: 'Cursor',
    cliName: 'cursor',
    settingsFolderName: 'Cursor',
    extensionsFolderName: '.cursor',
    windowsCliDirectories: () => [
      path.join(process.env.ProgramFiles || '', 'cursor', 'resources', 'app', 'bin'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'cursor', 'resources', 'app', 'bin'),
    ],
    macCliDirectories: ['/Applications/Cursor.app/Contents/Resources/app/bin'],
  }),
]);

export const EDITOR_FLAVOR_IDS = EDITOR_FLAVORS.map(flavor => flavor.id);

export function findEditorFlavor(flavorId) {
  return EDITOR_FLAVORS.find(flavor => flavor.id === String(flavorId).toLowerCase()) ?? null;
}

export function installedEditorFlavors() {
  return EDITOR_FLAVORS.filter(flavor => flavor.locateCli() !== null);
}
