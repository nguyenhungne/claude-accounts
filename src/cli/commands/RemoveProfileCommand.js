import { CctError } from '../../core/errors/CctError.js';
import { parseArguments, requireProfileName } from '../ArgumentParser.js';
import { Command, CommandSection } from '../Command.js';
import { askQuestion } from '../output/InteractivePrompt.js';

export class RemoveProfileCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['remove', 'rm'],
      section: CommandSection.PROFILES,
      usage: 'cct remove <profile> [--yes]',
      summary: 'delete a profile and its logins (shared data in ~/.claude is kept)',
    });
  }

  async execute(args) {
    const { positionals, options } = parseArguments(args, { flags: ['yes'], aliases: { y: 'yes' } });
    const profile = this.services.profiles.get(requireProfileName(positionals));
    if (profile.isDefault) throw new CctError('the default profile cannot be removed');
    if (!options.yes && !(await this.#confirmRemoval(profile))) {
      this.terminal.info('Cancelled.');
      return 1;
    }
    this.services.lifecycle.remove(profile);
    this.terminal.success(`cct: removed '${profile.name}'. Tokens were only deleted locally; revoke them on claude.ai or github.com if needed.`);
    return 0;
  }

  async #confirmRemoval(profile) {
    this.terminal.warn(`This deletes ${this.services.directories.rootOf(profile)}: the Claude, gh and az logins of this profile.`);
    this.terminal.warn('Shared items (memory, skills, plugins, ...) live in ~/.claude and are kept.');
    return (await askQuestion(this.terminal, `Type '${profile.name}' to confirm: `)) === profile.name;
  }
}
