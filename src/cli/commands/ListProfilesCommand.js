import { Command, CommandSection } from '../Command.js';
import { renderTable } from '../output/TableRenderer.js';

const NOT_AVAILABLE = '-';

function describeAccount(account, isShared) {
  if (!isShared) return account ?? NOT_AVAILABLE;
  return account ? `${account} (shared)` : 'shared';
}

export class ListProfilesCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['list', 'ls', 'status'],
      section: CommandSection.PROFILES,
      usage: 'cct list',
      summary: 'every profile with its Claude, GitHub and git account',
    });
  }

  async execute() {
    const rows = this.services.overview.describeAll(process.cwd()).map(overview => ({
      PROFILE: overview.name,
      NOW: [overview.isActiveInShell && 'active', overview.isBoundToFolder && 'here'].filter(Boolean).join(','),
      CLAUDE: overview.claudeAccount ?? NOT_AVAILABLE,
      GITHUB: describeAccount(overview.githubAccount, overview.githubIsShared),
      GIT: describeAccount(overview.gitEmail, overview.gitIsShared),
      SEPARATE: overview.separateItems.join(',') || NOT_AVAILABLE,
    }));
    this.terminal.print(renderTable(rows));
    return 0;
  }
}
