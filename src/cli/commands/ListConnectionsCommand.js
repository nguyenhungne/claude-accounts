import { Command, CommandSection } from '../Command.js';
import { renderTable } from '../output/TableRenderer.js';

export class ListConnectionsCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['connections'],
      section: CommandSection.CONNECTIONS,
      usage: 'cct connections [profile]',
      summary: 'MCP services (ClickUp, Notion, Slack, ...) and whether each profile is signed in',
    });
  }

  async execute(args) {
    const profiles = args.length ? [this.services.profiles.get(args[0])] : this.services.profiles.list();
    const rows = profiles.flatMap(profile =>
      this.services.mcpConnections.describeAll(profile).map(({ server, state }) => ({
        PROFILE: profile.name,
        SERVICE: server.id,
        STATE: state,
      })),
    );
    this.terminal.print(renderTable(rows));
    return 0;
  }
}
