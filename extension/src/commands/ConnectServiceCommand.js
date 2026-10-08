const { ExtensionCommand } = require('./ExtensionCommand');

class ConnectServiceCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.connectService');
  }

  async execute(argument, serverIdArgument) {
    const profile = await this.resolveProfile(argument, 'Connect a service for profile...');
    if (!profile) return;
    const connection = await this.#chooseConnection(profile, argument?.serverId ?? serverIdArgument);
    if (!connection) return;

    const { server } = connection;
    const configuredName = this.#ensureConfigured(profile, connection);
    this.extension.refresh();

    const signInHint = `Type /mcp, choose "${configuredName}" and pick Authenticate. A browser window opens to sign in to ${server.displayName}.`;
    this.extension.terminals.launchClaude(profile, this.extension.workspaceFolders.current(), { message: signInHint });
    this.vscode.window.showInformationMessage(`Claude Accounts: ${signInHint}`);
  }

  #ensureConfigured(profile, { server, configuredName, needsReconfiguration }) {
    if (configuredName && !needsReconfiguration) return configuredName;
    const { mcpInstaller } = this.services;
    const owner = configuredName
      ? mcpInstaller.reconfigure(profile, server, configuredName)
      : mcpInstaller.add(profile, server);
    const scope = owner.isDefault ? 'every profile that shares MCP servers' : `'${profile.name}' only`;
    this.extension.output.appendLine(`${configuredName ? 'Re-added' : 'Added'} ${server.displayName} (${server.url}) for ${scope}.`);
    return server.id;
  }

  async #chooseConnection(profile, serverId) {
    const connections = this.services.mcpConnections.describeAll(profile);
    if (serverId) return connections.find(({ server }) => server.id === serverId) ?? null;
    const selected = await this.vscode.window.showQuickPick(
      connections.map(connection => ({
        label: `$(${connection.server.iconId}) ${connection.server.displayName}`,
        description: connection.state,
        detail: connection.server.description,
        connection,
      })),
      { placeHolder: `Connect a service for '${profile.name}'`, matchOnDetail: true },
    );
    return selected?.connection ?? null;
  }
}

module.exports = { ConnectServiceCommand };
