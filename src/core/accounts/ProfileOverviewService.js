import { ISOLATED_TOOLS } from '../tools/IsolatedTools.js';

export class ProfileOverviewService {
  constructor({ profiles, bindings, accounts, environmentBaseline, toolTokens }) {
    this.profiles = profiles;
    this.bindings = bindings;
    this.accounts = accounts;
    this.environmentBaseline = environmentBaseline;
    this.toolTokens = toolTokens;
  }

  describeAll(folder = null) {
    const bindingForFolder = folder ? this.bindings.closestTo(folder) : null;
    const allBindings = this.bindings.list();
    return this.profiles.list().map(profile => this.#describe(profile, { bindingForFolder, allBindings }));
  }

  describe(profile, folder = null) {
    const bindingForFolder = folder ? this.bindings.closestTo(folder) : null;
    return this.#describe(profile, { bindingForFolder, allBindings: this.bindings.list() });
  }

  #describe(profile, { bindingForFolder, allBindings }) {
    const githubAccount = this.accounts.githubUser(profile);
    const gitEmail = this.accounts.gitEmail(profile);
    return {
      profile,
      name: profile.name,
      description: profile.description,
      isDefault: profile.isDefault,
      isActiveInShell: this.environmentBaseline.activeProfileName === profile.name,
      isBoundToFolder: bindingForFolder !== null && bindingForFolder.profile === profile.name,
      claudeAccount: this.accounts.claudeAccount(profile),
      githubAccount,
      githubIsShared: !profile.isDefault && !profile.isolates('gh'),
      gitEmail,
      gitIsShared: !profile.isDefault && !profile.isolates('git'),
      separateItems: profile.isDefault ? [] : ['claude', ...profile.toolIds],
      boundFolders: allBindings.filter(binding => binding.profile === profile.name).map(binding => binding.path),
      tools: this.#toolsOf(profile, { githubAccount, gitEmail }),
    };
  }

  #toolsOf(profile, { githubAccount, gitEmail }) {
    const knownAccounts = { gh: githubAccount, git: gitEmail };
    return ISOLATED_TOOLS.map(tool => {
      const isSeparate = !profile.isDefault && profile.isolates(tool.id);
      const hasToken = tool.usesTokenLoginFor(profile) && this.toolTokens.has(profile, tool.id);
      return {
        toolId: tool.id,
        displayName: tool.displayName,
        isSeparate,
        canLogIn: tool.supportsLogin,
        usesToken: tool.usesTokenLoginFor(profile),
        account: knownAccounts[tool.id] ?? (hasToken ? 'token saved' : null),
      };
    });
  }
}
