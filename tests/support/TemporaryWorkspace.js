import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServices } from '../../src/core/createServices.js';
import { Profile } from '../../src/core/profiles/Profile.js';

export class TemporaryWorkspace {
  constructor({ extraEnvironment = {} } = {}) {
    this.root = fs.mkdtempSync(path.join(os.tmpdir(), 'cct-test-'));
    this.defaultClaudeDirectory = path.join(this.root, 'default-claude');
    fs.mkdirSync(this.defaultClaudeDirectory, { recursive: true });
    this.environment = {
      PATH: process.env.PATH,
      CCT_HOME: path.join(this.root, 'cct-data'),
      CLAUDE_CONFIG_DIR: this.defaultClaudeDirectory,
      ...extraEnvironment,
    };
    this.services = createServices({ environment: this.environment });
  }

  withEnvironment(extraEnvironment) {
    return createServices({ environment: { ...this.environment, ...extraEnvironment } });
  }

  writeDefaultClaudeFile(relativePath, content) {
    const file = path.join(this.defaultClaudeDirectory, relativePath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return file;
  }

  createProfile(properties) {
    const profile = new Profile(properties);
    this.services.profiles.create(profile);
    return profile;
  }

  profileClaudePath(profile, relativePath) {
    return path.join(this.services.directories.claudeConfigDirectory(profile), relativePath);
  }

  createFolder(relativePath) {
    const folder = path.join(this.root, relativePath);
    fs.mkdirSync(folder, { recursive: true });
    return folder;
  }

  dispose() {
    fs.rmSync(this.root, { recursive: true, force: true });
  }
}
