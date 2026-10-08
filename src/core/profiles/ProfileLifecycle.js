import { CctError } from '../errors/CctError.js';
import { canonicalItemName, SHAREABLE_ITEM_NAMES } from '../sharing/SharedClaudeItems.js';
import { DEFAULT_ISOLATED_TOOL_IDS, ISOLATED_TOOL_IDS } from '../tools/IsolatedTools.js';
import { Profile } from './Profile.js';
import { isReservedProfileName } from './ReservedProfileNames.js';

const currentTimestamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

export class ProfileLifecycle {
  constructor({ profiles, bindings, linker, synchronizer }) {
    this.profiles = profiles;
    this.bindings = bindings;
    this.linker = linker;
    this.synchronizer = synchronizer;
  }

  validateNewName(rawName) {
    const name = String(rawName ?? '').trim().toLowerCase();
    if (!name) return 'Enter a profile name';
    if (!Profile.isValidName(name)) return 'Use lowercase letters, digits, - or _ (max 32 characters), starting with a letter or digit';
    if (isReservedProfileName(name)) return `'${name}' is reserved`;
    if (this.profiles.exists(name)) return `Profile '${name}' already exists`;
    return null;
  }

  create({ name, description = '', toolIds = DEFAULT_ISOLATED_TOOL_IDS, gitIdentity = {}, unsharedItems = [], environment = {} }) {
    const nameError = this.validateNewName(name);
    if (nameError) throw new CctError(nameError);
    const profile = new Profile({
      name: String(name).trim(),
      description,
      toolIds: this.#validatedToolIds(toolIds),
      gitIdentity,
      environment,
      unsharedItems: this.#canonicalUnsharedItems(unsharedItems),
      createdAt: currentTimestamp(),
    });
    this.profiles.create(profile);
    return { profile, warnings: this.synchronizer.synchronize(profile) };
  }

  remove(profile) {
    if (profile.isDefault) throw new CctError('the default profile cannot be removed');
    this.linker.releaseAll(profile);
    this.profiles.delete(profile);
    this.bindings.removeProfile(profile.name);
  }

  #validatedToolIds(toolIds) {
    const normalized = toolIds.map(toolId => String(toolId).toLowerCase());
    const unknown = normalized.find(toolId => !ISOLATED_TOOL_IDS.includes(toolId));
    if (unknown) throw new CctError(`unknown tool '${unknown}' (supported: ${ISOLATED_TOOL_IDS.join(', ')})`);
    return normalized;
  }

  #canonicalUnsharedItems(itemNames) {
    return itemNames.map(itemName => {
      const canonicalName = canonicalItemName(itemName);
      if (!canonicalName) throw new CctError(`cannot unshare '${itemName}' (choose from: ${SHAREABLE_ITEM_NAMES.join(', ')})`);
      return canonicalName;
    });
  }
}
