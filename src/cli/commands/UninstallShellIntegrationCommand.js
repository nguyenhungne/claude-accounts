import { Command, CommandSection } from '../Command.js';

export class UninstallShellIntegrationCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['uninstall'],
      section: CommandSection.SETUP,
      usage: 'cct uninstall',
      summary: 'remove the shell integration (profiles are kept)',
    });
  }

  async execute() {
    for (const { file, changed } of this.services.shellIntegration.uninstall()) {
      if (changed) this.terminal.success(`cleaned  ${file}`);
    }
    this.terminal.info(`Profiles and logins are kept in ${this.services.appPaths.dataRoot}; delete that folder to remove them too.`);
    return 0;
  }
}
