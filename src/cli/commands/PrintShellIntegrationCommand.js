import path from 'node:path';
import { isWindows } from '../../core/platform/Platform.js';
import { shellDialect, SHELL_DIALECT_NAMES } from '../../core/shell/ShellDialects.js';
import { Command, CommandSection } from '../Command.js';

export class PrintShellIntegrationCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['init'],
      section: CommandSection.SETUP,
      usage: `cct init <${SHELL_DIALECT_NAMES.join('|')}>`,
      summary: 'print the shell integration script',
    });
  }

  async execute(args) {
    const shellName = args[0] ?? (isWindows ? 'pwsh' : path.basename(process.env.SHELL || 'zsh'));
    this.terminal.print(this.services.shellIntegration.integrationScript(shellDialect(shellName)));
    return 0;
  }
}
