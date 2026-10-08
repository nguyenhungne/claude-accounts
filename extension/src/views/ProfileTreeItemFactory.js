const NOT_LOGGED_IN = 'not logged in';

function describeSharedAccount(account, isShared) {
  if (!isShared) return account ?? 'not set';
  return account ? `${account} (shared with default)` : 'shared with default';
}

class ProfileTreeItemFactory {
  constructor(vscode, connectionStates) {
    this.vscode = vscode;
    this.connectionStates = connectionStates;
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

  detailItems(overview, connections) {
    const details = [
      this.#detail(overview, 'Claude', overview.claudeAccount ?? NOT_LOGGED_IN, 'sparkle', overview.claudeAccount ? null : {
        command: 'cct.login',
        title: 'Log In',
        arguments: [overview.name],
      }),
      this.#detail(overview, 'GitHub', describeSharedAccount(overview.githubAccount, overview.githubIsShared), 'github'),
      this.#detail(overview, 'Git', describeSharedAccount(overview.gitEmail, overview.gitIsShared), 'git-commit'),
      this.#detail(overview, 'Separate', overview.isDefault ? 'your normal ~/.claude and CLI logins' : overview.separateItems.join(', '), 'lock', overview.isDefault ? null : {
        command: 'cct.chooseSeparateTools',
        title: 'Choose Separate CLIs',
        arguments: [overview.name],
      }),
    ];
    if (overview.description && !overview.isDefault) details.push(this.#detail(overview, 'Note', overview.description, 'note'));
    for (const { toolId, displayName, hasToken } of overview.tokenLogins) {
      details.push(this.#detail(overview, displayName.replace(/ CLI$/, ''), hasToken ? 'token saved' : NOT_LOGGED_IN, 'key', {
        command: 'cct.login',
        title: hasToken ? 'Replace Token' : 'Log In',
        arguments: [overview.name, toolId],
      }));
    }
    for (const folderPath of overview.boundFolders) details.push(this.#boundFolderItem(overview, folderPath));
    details.push(this.#connectionsGroupItem(overview, connections));
    return details;
  }

  connectionItem(profileName, { server, configuredName, needsReconfiguration, state }) {
    const { TreeItem, TreeItemCollapsibleState, ThemeIcon, ThemeColor, MarkdownString } = this.vscode;
    const isConnected = state === this.connectionStates.CONNECTED;
    const item = new TreeItem(server.displayName, TreeItemCollapsibleState.None);
    item.id = `profile:${profileName}:connection:${server.id}`;
    item.description = needsReconfiguration ? `${state}, needs repair` : state;
    item.iconPath = isConnected ? new ThemeIcon('pass-filled', new ThemeColor('charts.green')) : new ThemeIcon(server.iconId);
    item.contextValue = isConnected ? 'cctConnectionConnected' : 'cctConnectionAvailable';
    item.profileName = profileName;
    item.serverId = server.id;
    item.tooltip = new MarkdownString(
      `**${server.displayName}** · ${server.description}\n\n${server.url}${configuredName && configuredName !== server.id ? `\n\nConfigured as \`${configuredName}\`` : ''}\n\n${isConnected ? 'Signed in for this profile.' : 'Click to connect this profile.'}`,
    );
    if (!isConnected) item.command = { command: 'cct.connectService', title: 'Connect', arguments: [item] };
    return item;
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

  #connectionsGroupItem(overview, connections) {
    const { TreeItem, TreeItemCollapsibleState, ThemeIcon } = this.vscode;
    const connectedCount = connections.filter(({ state }) => state === this.connectionStates.CONNECTED).length;
    const item = new TreeItem('Connections', TreeItemCollapsibleState.Collapsed);
    item.id = `profile:${overview.name}:connections`;
    item.description = `${connectedCount}/${connections.length} connected`;
    item.tooltip = 'MCP services Claude can use as this profile. Each profile signs in separately.';
    item.iconPath = new ThemeIcon('plug');
    item.contextValue = 'cctConnections';
    item.profileName = overview.name;
    item.connections = connections;
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
