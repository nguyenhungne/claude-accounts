import { Command, CommandSection } from '../Command.js';

export class VersionCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['version', '--version', '-v'],
      section: CommandSection.SETUP,
      usage: 'cct version',
      summary: 'print the version',
    });
  }

  async execute() {
    this.terminal.print(this.context.version);
    return 0;
  }
}
