import { isPathInside, normalizeFolderPath, pathsEqual, readJsonFile, writeJsonFile } from '../fileSystem/FileSystem.js';

export class FolderBindingRepository {
  constructor(appPaths) {
    this.appPaths = appPaths;
  }

  list() {
    const bindings = readJsonFile(this.appPaths.bindingsFile);
    return Array.isArray(bindings) ? bindings : [];
  }

  bind(folder, profileName) {
    const folderPath = normalizeFolderPath(folder);
    const bindings = this.list().filter(binding => !pathsEqual(binding.path, folderPath));
    bindings.push({ path: folderPath, profile: profileName });
    this.#save(bindings);
    return folderPath;
  }

  unbind(folder) {
    const folderPath = normalizeFolderPath(folder);
    const bindings = this.list();
    const remaining = bindings.filter(binding => !pathsEqual(binding.path, folderPath));
    if (remaining.length === bindings.length) return false;
    this.#save(remaining);
    return true;
  }

  closestTo(folder) {
    const folderPath = normalizeFolderPath(folder);
    let closest = null;
    for (const binding of this.list()) {
      const applies = pathsEqual(folderPath, binding.path) || isPathInside(folderPath, binding.path);
      if (applies && (!closest || binding.path.length > closest.path.length)) closest = binding;
    }
    return closest;
  }

  removeProfile(profileName) {
    this.#save(this.list().filter(binding => binding.profile !== profileName));
  }

  #save(bindings) {
    writeJsonFile(this.appPaths.bindingsFile, [...bindings].sort((first, second) => first.path.localeCompare(second.path)));
  }
}
