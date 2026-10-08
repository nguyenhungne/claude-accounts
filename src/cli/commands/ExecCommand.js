import { CctError } from '../../core/errors/CctError.js';
import { requireExecutable } from '../../core/platform/ExecutableLocator.js';
import { Command, CommandSection } from '../Command.js';

export class ExecCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['exec'],
      section: CommandSection.OTHER_TOOLS,
      usage: 'cct exec <profile> <command> [args]',
      summary: 'run any command as a profile, e.g. cct exec work gh pr list',
    });
  }

  async execute(args) {
    const [profileName, commandName, ...commandArguments] = args;
    if (!profileName || !commandName) throw new CctError(`usage: ${this.usage}`);
    const profile = this.services.profiles.get(profileName);
    return this.context.session.run(profile, requireExecutable(commandName), commandArguments);
  }
}
