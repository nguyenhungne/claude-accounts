import { renderAssignments, shellDialect } from '../../core/shell/ShellDialects.js';
import { parseArguments, requireProfileName } from '../ArgumentParser.js';
import { Command, CommandSection } from '../Command.js';

export class UseProfileCommand extends Command {
  constructor(context, metadata = {
    names: ['use'],
    section: CommandSection.OTHER_TOOLS,
    usage: 'cct use <profile>',
    summary: 'switch the current shell to a profile (needs "cct install")',
  }) {
    super(context, metadata);
  }

  async execute(args) {
    const { positionals, options } = parseArguments(args);
    if (!options.emit) return this.#explainShellIntegration();
    const assignments = this.assignmentsFor(positionals);
    this.terminal.print(renderAssignments(assignments, shellDialect(options.emit)));
    this.terminal.success(this.confirmationMessage(positionals));
    return 0;
  }

  assignmentsFor(positionals) {
    const profile = this.services.profiles.get(requireProfileName(positionals));
    this.context.session.prepare(profile);
    return profile.isDefault
      ? this.services.environmentBuilder.resetAssignments()
      : this.services.environmentBuilder.assignmentsFor(profile);
  }

  confirmationMessage(positionals) {
    const profileName = requireProfileName(positionals);
    return profileName === 'default'
      ? 'cct: this shell is back to the default profile'
      : `cct: this shell now uses '${profileName}' (cct reset to undo)`;
  }

  #explainShellIntegration() {
    this.terminal.warn(`cct: '${this.names[0]}' changes your current shell, which needs the shell integration.`);
    this.terminal.warn("     Run 'cct install' once and open a new terminal, or use 'cct shell <profile>' instead.");
    return 1;
  }
}
