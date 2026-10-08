class ProfileTreeDataProvider {
  constructor(extension, itemFactory) {
    this.extension = extension;
    this.itemFactory = itemFactory;
    this.changeEmitter = new extension.vscode.EventEmitter();
    this.onDidChangeTreeData = this.changeEmitter.event;
  }

  refresh() {
    this.changeEmitter.fire(undefined);
  }

  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    if (element?.overview) {
      const connections = this.extension.services.mcpConnections.describeAll(element.overview.profile);
      return this.itemFactory.detailItems(element.overview, connections);
    }
    if (element?.connections) return element.connections.map(connection => this.itemFactory.connectionItem(element.profileName, connection));
    if (element) return [];
    try {
      const folder = this.extension.workspaceFolders.current();
      return this.extension.services.overview.describeAll(folder).map(overview => this.itemFactory.profileItem(overview));
    } catch (error) {
      return [this.itemFactory.messageItem(error.message, 'error')];
    }
  }
}

module.exports = { ProfileTreeDataProvider };
