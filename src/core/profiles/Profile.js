import { blankToNull } from '../text/Text.js';

export const DEFAULT_PROFILE_NAME = 'default';
const PROFILE_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,31}$/;

const toLowerCaseList = values => (Array.isArray(values) ? values : []).filter(Boolean).map(value => String(value).toLowerCase());
const toTrimmedList = values => (Array.isArray(values) ? values : []).map(value => String(value).trim()).filter(Boolean);

export class Profile {
  constructor({ name, description = '', toolIds = [], gitIdentity = {}, environment = {}, unsharedItems = [], createdAt = null }) {
    this.name = String(name).toLowerCase();
    this.description = description ?? '';
    this.toolIds = toLowerCaseList(toolIds);
    this.gitIdentity = { name: blankToNull(gitIdentity?.name), email: blankToNull(gitIdentity?.email) };
    this.environment = { ...(environment ?? {}) };
    this.unsharedItems = toTrimmedList(unsharedItems);
    this.createdAt = createdAt;
  }

  static isValidName(name) {
    return PROFILE_NAME_PATTERN.test(String(name));
  }

  static createDefault() {
    return new Profile({ name: DEFAULT_PROFILE_NAME, description: 'your existing ~/.claude and global CLI logins' });
  }

  static fromJson(name, json = {}) {
    return new Profile({
      name,
      description: json.description,
      toolIds: json.tools,
      gitIdentity: json.git,
      environment: json.env,
      unsharedItems: json.unshare,
      createdAt: json.created,
    });
  }

  get isDefault() {
    return this.name === DEFAULT_PROFILE_NAME;
  }

  isolates(toolId) {
    return this.toolIds.includes(toolId);
  }

  sharesClaudeItem(itemName) {
    if (this.isDefault) return false;
    return !this.unsharedItems.some(unshared => unshared.toLowerCase() === itemName.toLowerCase());
  }

  toJson() {
    return {
      description: this.description,
      tools: this.toolIds,
      git: this.gitIdentity,
      env: this.environment,
      unshare: this.unsharedItems,
      created: this.createdAt,
    };
  }
}
