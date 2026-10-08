class ProfilePicker {
  constructor(extension) {
    this.extension = extension;
  }

  async pick({ placeHolder, includeDefault = true } = {}) {
    const folder = this.extension.workspaceFolders.current();
    const overviews = this.extension.services.overview
      .describeAll(folder)
      .filter(overview => includeDefault || !overview.isDefault)
      .sort((first, second) => Number(second.isBoundToFolder) - Number(first.isBoundToFolder));
    if (overviews.length === 0) {
      this.extension.vscode.window.showInformationMessage('Claude Accounts: no profile to choose yet. Add one first.');
      return null;
    }
    const items = overviews.map(overview => ({
      label: `$(${overview.isBoundToFolder ? 'pass-filled' : 'account'}) ${overview.name}`,
      description: overview.claudeAccount ?? 'not logged in',
      detail: [overview.description, overview.isBoundToFolder ? 'used for this folder' : null].filter(Boolean).join(' · ') || undefined,
      profile: overview.profile,
    }));
    const selected = await this.extension.vscode.window.showQuickPick(items, { placeHolder, matchOnDescription: true });
    return selected?.profile ?? null;
  }
}

module.exports = { ProfilePicker };
