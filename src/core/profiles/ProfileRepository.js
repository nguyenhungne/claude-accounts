import fs from 'node:fs';
import path from 'node:path';
import { CctError } from '../errors/CctError.js';
import { isDirectory, isFile, readJsonFile, writeJsonFile } from '../fileSystem/FileSystem.js';
import { DEFAULT_PROFILE_NAME, Profile } from './Profile.js';

export class ProfileRepository {
  constructor(appPaths) {
    this.appPaths = appPaths;
  }

  profileFile(profileName) {
    return path.join(this.appPaths.profileDirectory(profileName), 'profile.json');
  }

  exists(profileName) {
    const name = String(profileName ?? '').toLowerCase();
    if (name === DEFAULT_PROFILE_NAME) return true;
    return Profile.isValidName(name) && isFile(this.profileFile(name));
  }

  get(profileName) {
    const name = String(profileName ?? '').toLowerCase();
    if (name === DEFAULT_PROFILE_NAME) return Profile.createDefault();
    if (!this.exists(name)) throw new CctError(`profile '${name}' not found (see: cct list)`);
    return Profile.fromJson(name, readJsonFile(this.profileFile(name)) ?? {});
  }

  list() {
    const profiles = [Profile.createDefault()];
    if (!isDirectory(this.appPaths.profilesDirectory)) return profiles;
    const names = fs.readdirSync(this.appPaths.profilesDirectory).sort();
    for (const name of names) {
      if (name !== DEFAULT_PROFILE_NAME && this.exists(name)) profiles.push(this.get(name));
    }
    return profiles;
  }

  create(profile) {
    if (this.exists(profile.name)) throw new CctError(`profile '${profile.name}' already exists`);
    this.save(profile);
  }

  save(profile) {
    if (profile.isDefault) throw new CctError('the default profile is not stored in a profile.json');
    writeJsonFile(this.profileFile(profile.name), profile.toJson());
  }

  delete(profile) {
    if (profile.isDefault) throw new CctError('the default profile cannot be removed');
    fs.rmSync(this.appPaths.profileDirectory(profile.name), { recursive: true, force: true });
  }
}
