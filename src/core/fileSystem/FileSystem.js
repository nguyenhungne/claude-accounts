import fs from 'node:fs';
import path from 'node:path';
import { CctError } from '../errors/CctError.js';
import { isWindows, pathsAreCaseInsensitive } from '../platform/Platform.js';

export function tryLstat(target) {
  try {
    return fs.lstatSync(target);
  } catch {
    return null;
  }
}

export function tryStat(target) {
  try {
    return fs.statSync(target);
  } catch {
    return null;
  }
}

export const isFile = target => tryStat(target)?.isFile() ?? false;
export const isDirectory = target => tryStat(target)?.isDirectory() ?? false;

export function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

export function writeTextAtomically(file, text) {
  ensureDirectory(path.dirname(file));
  const temporaryFile = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, text);
  fs.renameSync(temporaryFile, file);
}

export function readJsonFile(file, { tolerateInvalid = false } = {}) {
  let content;
  try {
    content = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  } catch {
    return null;
  }
  if (!content.trim()) return null;
  try {
    return JSON.parse(content);
  } catch (error) {
    if (tolerateInvalid) return null;
    throw new CctError(`invalid JSON in ${file}: ${error.message}`);
  }
}

export function writeJsonFile(file, value) {
  writeTextAtomically(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function isSameFile(firstPath, secondPath) {
  try {
    const first = fs.statSync(firstPath, { bigint: true });
    const second = fs.statSync(secondPath, { bigint: true });
    return first.ino === second.ino && first.dev === second.dev;
  } catch {
    return false;
  }
}

export function removeLink(link) {
  try {
    fs.unlinkSync(link);
  } catch {
    fs.rmdirSync(link);
  }
}

export function createDirectoryLink(target, link) {
  fs.symlinkSync(target, link, isWindows ? 'junction' : 'dir');
}

export function createFileLink(target, link) {
  try {
    fs.symlinkSync(target, link, 'file');
  } catch {
    fs.linkSync(target, link);
  }
}

export function pathsEqual(firstPath, secondPath) {
  return pathsAreCaseInsensitive ? firstPath.toLowerCase() === secondPath.toLowerCase() : firstPath === secondPath;
}

export function isPathInside(childPath, parentPath) {
  const parentPrefix = parentPath.endsWith(path.sep) ? parentPath : parentPath + path.sep;
  return pathsAreCaseInsensitive
    ? childPath.toLowerCase().startsWith(parentPrefix.toLowerCase())
    : childPath.startsWith(parentPrefix);
}

function resolveRealPath(target) {
  try {
    return fs.realpathSync.native(target);
  } catch {
    return target;
  }
}

export function normalizeFolderPath(folder) {
  const resolvedPath = resolveRealPath(path.resolve(folder));
  const rootLength = path.parse(resolvedPath).root.length;
  return resolvedPath.length > rootLength ? resolvedPath.replace(/[\\/]+$/, '') : resolvedPath;
}
