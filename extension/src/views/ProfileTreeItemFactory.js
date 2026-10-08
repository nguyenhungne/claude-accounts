const NOT_LOGGED_IN = 'not logged in';

function describeSharedAccount(account, isShared) {
  if (!isShared) return account ?? 'not set';
  return account ? `${account} (shared with default)` : 'shared with default';
}

class ProfileTreeItemFactory {
  constructor(vscode) {
    this.vscode = vscode;
  }

  profileItem(overview) {
    const { TreeItem, TreeItemCollapsibleState, ThemeIcon, ThemeColor } = this.vscode;
    const isUsedHere = overview.isBoundToFolder || overview.isActiveInShell;
    const item = new TreeItem(overview.name, TreeItemCollapsibleState.Collapsed);
    item.id = `profile:${overview.name}`;
    item.description = [overview.claudeAccount ?? NOT_LOGGED_IN, isUsedHere ? 'this folder' : null].filter(Boolean).join(' · ');
    item.tooltip = this.#profileTooltip(overview);
    item.iconPath = isUsedHere ? new ThemeIcon('pass-filled', new ThemeColor('charts.green')) : new ThemeIcon('account');
    item.contextValue = overview.isDefault ? 'cctProfileDefault' : 'cctProfile';
    item.profileName = overview.name;
    item.overview = overview;
    return item;
  }

  detailItems(overview) {
    const details = [
      this.#detail(overview, 'Claude', overview.claudeAccount ?? NOT_LOGGED_IN, 'sparkle', overview.claudeAccount ? null : {
        command: 'cct.login',
        title: 'Log In',
        arguments: [overview.name],
      }),
      this.#detail(overview, 'GitHub', describeSharedAccount(overview.githubAccount, overview.githubIsShared), 'github'),
      this.#detail(overview, 'Git', describeSharedAccount(overview.gitEmail, overview.gitIsShared), 'git-commit'),
      this.#detail(overview, 'Separate', overview.isDefault ? 'your normal ~/.claude and CLI logins' : overview.separateItems.join(', '), 'lock'),
    ];
    if (overview.description) details.push(this.#detail(overview, 'Note', overview.description, 'note'));
    for (const folderPath of overview.boundFolders) details.push(this.#boundFolderItem(overview, folderPath));
    return details;
  }

  messageItem(message, iconId = 'info') {
    const item = new this.vscode.TreeItem(message, this.vscode.TreeItemCollapsibleState.None);
    item.iconPath = new this.vscode.ThemeIcon(iconId);
    return item;
  }

  #detail(overview, label, value, iconId, command = null) {
    const item = new this.vscode.TreeItem(label, this.vscode.TreeItemCollapsibleState.None);
    item.id = `profile:${overview.name}:${label}`;
    item.description = value;
    item.tooltip = `${label}: ${value}`;
    item.iconPath = new this.vscode.ThemeIcon(iconId);
    item.contextValue = 'cctDetail';
    if (command) item.command = command;
    return item;
  }

  #boundFolderItem(overview, folderPath) {
    const item = new this.vscode.TreeItem('Folder', this.vscode.TreeItemCollapsibleState.None);
    item.id = `profile:${overview.name}:folder:${folderPath}`;
    item.description = folderPath;
    item.tooltip = `Claude starts as '${overview.name}' inside ${folderPath} and its subfolders`;
    item.iconPath = new this.vscode.ThemeIcon('folder');
    item.contextValue = 'cctBoundFolder';
    item.folderPath = folderPath;
    return item;
  }

  #profileTooltip(overview) {
    const tooltip = new this.vscode.MarkdownString();
    tooltip.appendMarkdown(`**${overview.name}**${overview.description ? ` · ${overview.description}` : ''}\n\n`);
    tooltip.appendMarkdown(`- Claude: ${overview.claudeAccount ?? NOT_LOGGED_IN}\n`);
    tooltip.appendMarkdown(`- GitHub: ${describeSharedAccount(overview.githubAccount, overview.githubIsShared)}\n`);
    tooltip.appendMarkdown(`- Git: ${describeSharedAccount(overview.gitEmail, overview.gitIsShared)}\n`);
    if (overview.boundFolders.length) tooltip.appendMarkdown(`- Folders: ${overview.boundFolders.join(', ')}\n`);
    return tooltip;
  }
}

module.exports = { ProfileTreeItemFactory };
