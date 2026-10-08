import fs from 'node:fs';
import path from 'node:path';
import { CctError } from '../errors/CctError.js';
import { ensureDirectory, isFile } from '../fileSystem/FileSystem.js';

const TOKEN_FILE_NAME = 'token';

export function toolTokenFile(profileRoot, toolId) {
  return path.join(profileRoot, toolId, TOKEN_FILE_NAME);
}

export function readToolToken(profileRoot, toolId) {
  const file = toolTokenFile(profileRoot, toolId);
  if (!profileRoot || !isFile(file)) return null;
  return fs.readFileSync(file, 'utf8').trim() || null;
}

export class ToolTokenStore {
  constructor(directories) {
    this.directories = directories;
  }

  has(profile, toolId) {
    return readToolToken(this.directories.rootOf(profile), toolId) !== null;
  }

  save(profile, toolId, token) {
    const trimmed = String(token ?? '').trim();
    if (!trimmed) throw new CctError('the token is empty');
    if (profile.isDefault) throw new CctError('the default profile keeps its normal login; use the tool\'s own login command');
    const file = toolTokenFile(this.directories.rootOf(profile), toolId);
    ensureDirectory(path.dirname(file));
    fs.writeFileSync(file, `${trimmed}\n`, { mode: 0o600 });
    return file;
  }

  remove(profile, toolId) {
    fs.rmSync(toolTokenFile(this.directories.rootOf(profile), toolId), { force: true });
  }
}
