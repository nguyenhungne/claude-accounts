import { isWindows } from '../../core/platform/Platform.js';
import { renderAssignments, shellDialect } from '../../core/shell/ShellDialects.js';
import { parseArguments, requireProfileName } from '../ArgumentParser.js';
import { Command, CommandSection } from '../Command.js';

export class PrintEnvironmentCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['env'],
      section: CommandSection.OTHER_TOOLS,
      usage: 'cct env <profile> [--shell pwsh|zsh|bash]',
      summary: 'print env assignments, e.g. cct env work | iex',
    });
  }

  async execute(args) {
    const { positionals, options } = parseArguments(args, { aliases: { s: 'shell' } });
    const profile = this.services.profiles.get(requireProfileName(positionals));
    const dialect = shellDialect(options.shell ?? (isWindows ? 'pwsh' : 'bash'));
    const { environmentBuilder } = this.services;
    const assignments = profile.isDefault ? environmentBuilder.resetAssignments() : environmentBuilder.assignmentsFor(profile);
    this.terminal.print(renderAssignments(assignments, dialect));
    return 0;
  }
}
