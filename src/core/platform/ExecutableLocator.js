import path from 'node:path';
import { CctError } from '../errors/CctError.js';
import { isFile } from '../fileSystem/FileSystem.js';
import { isWindows } from './Platform.js';

const WINDOWS_EXECUTABLE_EXTENSIONS = ['.exe', '.cmd', '.bat', '.com'];

export function findExecutable(executableName, extraDirectories = []) {
  if (path.isAbsolute(executableName)) return isFile(executableName) ? executableName : null;
  const searchDirectories = [...(process.env.PATH || '').split(path.delimiter).filter(Boolean), ...extraDirectories];
  const extensions = isWindows && !path.extname(executableName) ? WINDOWS_EXECUTABLE_EXTENSIONS : [''];
  for (const directory of searchDirectories) {
    for (const extension of extensions) {
      const candidate = path.join(directory, executableName + extension);
      if (isFile(candidate)) return candidate;
    }
  }
  return null;
}

export function requireExecutable(executableName) {
  const executable = findExecutable(executableName);
  if (!executable) throw new CctError(`'${executableName}' was not found on PATH`);
  return executable;
}
