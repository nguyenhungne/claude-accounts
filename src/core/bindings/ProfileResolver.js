export class ActiveShellRule {
  constructor(environmentBaseline, profiles) {
    this.environmentBaseline = environmentBaseline;
    this.profiles = profiles;
  }

  resolve() {
    const activeProfileName = this.environmentBaseline.activeProfileName;
    if (!activeProfileName || !this.profiles.exists(activeProfileName)) return null;
    return { profileName: activeProfileName, reason: 'active in this shell' };
  }
}

export class FolderBindingRule {
  constructor(bindings, profiles) {
    this.bindings = bindings;
    this.profiles = profiles;
  }

  resolve(folder) {
    const binding = this.bindings.closestTo(folder);
    if (!binding || !this.profiles.exists(binding.profile)) return null;
    return { profileName: binding.profile, reason: `bound to ${binding.path}` };
  }
}

export class ProfileResolver {
  constructor(rules) {
    this.rules = rules;
  }

  resolve(folder) {
    for (const rule of this.rules) {
      const resolution = rule.resolve(folder);
      if (resolution) return resolution;
    }
    return null;
  }
}
