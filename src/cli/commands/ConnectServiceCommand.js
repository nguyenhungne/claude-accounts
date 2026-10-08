import { CctError } from '../../core/errors/CctError.js';
import { findMcpServer, MCP_SERVER_IDS } from '../../core/mcp/McpServerCatalog.js';
import { requireExecutable } from '../../core/platform/ExecutableLocator.js';
import { Command, CommandSection } from '../Command.js';

export class ConnectServiceCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['connect'],
      section: CommandSection.CONNECTIONS,
      usage: `cct connect <profile> <${MCP_SERVER_IDS.join('|')}>`,
      summary: 'add the MCP service if needed, then start Claude as the profile to sign in with /mcp',
    });
  }

  async execute(args) {
    const [profileName, serverId] = args;
    if (!profileName || !serverId) throw new CctError(`usage: ${this.usage}`);
    const profile = this.services.profiles.get(profileName);
    const server = findMcpServer(serverId);
    if (!server) throw new CctError(`unknown service '${serverId}' (supported: ${MCP_SERVER_IDS.join(', ')})`);

    const connection = this.services.mcpConnections.describeAll(profile).find(entry => entry.server.id === server.id);
    const configuredName = this.#ensureConfigured(profile, connection);
    this.terminal.highlight(`cct: in Claude, type /mcp, choose "${configuredName}" and pick Authenticate to sign in to ${server.displayName}`);
    return this.context.session.run(profile, requireExecutable('claude'), []);
  }

  #ensureConfigured(profile, { server, configuredName, needsReconfiguration }) {
    if (configuredName && !needsReconfiguration) return configuredName;
    const { mcpInstaller } = this.services;
    const owner = configuredName
      ? mcpInstaller.reconfigure(profile, server, configuredName)
      : mcpInstaller.add(profile, server);
    const scope = owner.isDefault ? 'for every profile that shares MCP servers' : `for '${profile.name}'`;
    this.terminal.success(`cct: ${configuredName ? 're-added' : 'added'} ${server.displayName} (${server.url}) ${scope}`);
    return server.id;
  }
}
