import fs from 'node:fs';
import path from 'node:path';
import { CctError } from '../errors/CctError.js';
import { ensureDirectory, isDirectory } from '../fileSystem/FileSystem.js';

const COPIED_USER_ITEMS = ['settings.json', 'keybindings.json', 'snippets'];

export class EditorWindowLauncher {
  constructor({ directories, environmentBuilder }) {
    this.directories = directories;
    this.environmentBuilder = environmentBuilder;
  }

  prepare({ profile, folder, flavor, cliExecutable = flavor.locateCli() }) {
    if (!cliExecutable) throw new CctError(`the ${flavor.displayName} command line ('${flavor.cliName}') was not found`);
    const environment = this.environmentBuilder.processEnvironmentFor(profile);
    if (profile.isDefault) return { executable: cliExecutable, args: ['--new-window', folder], environment };

    const userDataDirectory = this.directories.editorUserDataDirectory(profile, flavor.id);
    this.#seedUserSettings(flavor, userDataDirectory);
    return {
      executable: cliExecutable,
      args: ['--user-data-dir', userDataDirectory, '--extensions-dir', flavor.extensionsDirectory, folder],
      environment,
    };
  }

  #seedUserSettings(flavor, userDataDirectory) {
    const profileUserDirectory = path.join(userDataDirectory, 'User');
    if (isDirectory(profileUserDirectory)) return;
    ensureDirectory(profileUserDirectory);
    for (const itemName of COPIED_USER_ITEMS) {
      const source = path.join(flavor.userDirectory, itemName);
      if (fs.existsSync(source)) fs.cpSync(source, path.join(profileUserDirectory, itemName), { recursive: true });
    }
  }
}
