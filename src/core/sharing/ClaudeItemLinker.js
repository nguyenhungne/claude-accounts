import fs from 'node:fs';
import path from 'node:path';
import {
  createDirectoryLink,
  createFileLink,
  ensureDirectory,
  isFile,
  isSameFile,
  removeLink,
  tryLstat,
  tryStat,
} from '../fileSystem/FileSystem.js';
import { SHARED_CLAUDE_DIRECTORIES, SHARED_CLAUDE_FILES } from './SharedClaudeItems.js';

export const LinkState = Object.freeze({
  SHARED: 'shared',
  SEPARATE: 'separate',
  NOT_CREATED: 'not created yet',
  BROKEN: 'broken link (repaired on next launch)',
});

export class ClaudeItemLinker {
  constructor(directories, appPaths) {
    this.directories = directories;
    this.appPaths = appPaths;
  }

  shareDirectory(profile, itemName) {
    const { sharedPath, profilePath } = this.#pathsOf(profile, itemName);
    ensureDirectory(sharedPath);
    const existing = tryLstat(profilePath);
    if (existing) {
      if (isSameFile(profilePath, sharedPath)) return;
      if (existing.isSymbolicLink()) removeLink(profilePath);
      else if (existing.isDirectory()) {
        fs.cpSync(profilePath, sharedPath, { recursive: true, force: false, errorOnExist: false });
        this.#moveToBackup(profile, profilePath, itemName);
      } else this.#moveToBackup(profile, profilePath, itemName);
    }
    createDirectoryLink(sharedPath, profilePath);
  }

  shareFile(profile, { name: itemName, initialContent }) {
    const { sharedPath, profilePath } = this.#pathsOf(profile, itemName);
    const existing = tryLstat(profilePath);
    const profileOwnsRealFile = Boolean(existing) && !existing.isSymbolicLink();

    if (!isFile(sharedPath)) {
      ensureDirectory(path.dirname(sharedPath));
      if (profileOwnsRealFile) fs.renameSync(profilePath, sharedPath);
      else if (initialContent !== null) fs.writeFileSync(sharedPath, initialContent);
      else return;
      if (existing && !profileOwnsRealFile) removeLink(profilePath);
    } else if (existing) {
      if (isSameFile(profilePath, sharedPath)) return;
      if (existing.isSymbolicLink()) removeLink(profilePath);
      else if (existing.mtimeMs > tryStat(sharedPath).mtimeMs) this.#promoteProfileCopy(profile, profilePath, sharedPath, itemName);
      else this.#moveToBackup(profile, profilePath, itemName);
    }
    createFileLink(sharedPath, profilePath);
  }

  makeSeparate(profile, itemName) {
    const { sharedPath, profilePath } = this.#pathsOf(profile, itemName);
    const existing = tryLstat(profilePath);
    if (!existing) return;
    if (existing.isSymbolicLink()) {
      removeLink(profilePath);
      if (fs.existsSync(sharedPath)) fs.cpSync(sharedPath, profilePath, { recursive: true });
    } else if (existing.isFile() && isSameFile(profilePath, sharedPath)) {
      const temporaryCopy = `${profilePath}.${process.pid}.tmp`;
      fs.copyFileSync(profilePath, temporaryCopy);
      fs.unlinkSync(profilePath);
      fs.renameSync(temporaryCopy, profilePath);
    }
  }

  describe(profile, itemName) {
    const { sharedPath, profilePath } = this.#pathsOf(profile, itemName);
    const existing = tryLstat(profilePath);
    if (!existing) return LinkState.NOT_CREATED;
    if (isSameFile(profilePath, sharedPath)) return LinkState.SHARED;
    return existing.isSymbolicLink() ? LinkState.BROKEN : LinkState.SEPARATE;
  }

  releaseAll(profile) {
    const itemNames = [...SHARED_CLAUDE_DIRECTORIES, ...SHARED_CLAUDE_FILES.map(file => file.name)];
    for (const itemName of itemNames) {
      const { sharedPath, profilePath } = this.#pathsOf(profile, itemName);
      const existing = tryLstat(profilePath);
      if (existing?.isSymbolicLink()) removeLink(profilePath);
      else if (existing?.isFile() && isSameFile(profilePath, sharedPath)) fs.unlinkSync(profilePath);
    }
  }

  #pathsOf(profile, itemName) {
    return {
      sharedPath: path.join(this.directories.defaultClaudeConfigDirectory(), itemName),
      profilePath: path.join(this.directories.claudeConfigDirectory(profile), itemName),
    };
  }

  #promoteProfileCopy(profile, profilePath, sharedPath, itemName) {
    fs.copyFileSync(sharedPath, this.#backupLocation(profile, `${itemName}.default`));
    fs.renameSync(profilePath, sharedPath);
  }

  #moveToBackup(profile, sourcePath, itemName) {
    fs.renameSync(sourcePath, this.#backupLocation(profile, itemName));
  }

  #backupLocation(profile, itemName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDirectory = path.join(this.appPaths.backupsDirectory, `${timestamp}-${profile.name}`);
    ensureDirectory(backupDirectory);
    return path.join(backupDirectory, itemName);
  }
}
