import { Command, CommandSection } from '../Command.js';

export class InstallShellIntegrationCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['install'],
      section: CommandSection.SETUP,
      usage: 'cct install',
      summary: 'add the cct function and prompt marker to PowerShell, zsh and bash startup files',
    });
  }

  async execute() {
    const results = this.services.shellIntegration.install();
    if (results.length === 0) this.terminal.warn('cct: no PowerShell, zsh or bash startup file found');
    for (const { file, changed } of results) {
      this.terminal.info(`${changed ? this.terminal.colors.green('updated') : this.terminal.colors.dim('up to date')}  ${file}`);
    }
    this.terminal.info('');
    this.terminal.info('Open a new terminal, then try: cct help');
    return 0;
  }
}
