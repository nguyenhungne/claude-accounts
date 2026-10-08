import { CctError } from '../../core/errors/CctError.js';
import { findExecutable } from '../../core/platform/ExecutableLocator.js';
import { isWindows } from '../../core/platform/Platform.js';
import { runInteractive } from '../../core/platform/ProcessRunner.js';
import { requireProfileName } from '../ArgumentParser.js';
import { Command, CommandSection } from '../Command.js';

export class EditProfileCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['edit'],
      section: CommandSection.PROFILES,
      usage: 'cct edit <profile>',
      summary: 'edit profile.json (tools, git identity, extra env, unshare), then re-sync',
    });
  }

  async execute(args) {
    const profile = this.services.profiles.get(requireProfileName(args));
    if (profile.isDefault) throw new CctError('the default profile has no profile.json');
    const [editor, editorArguments] = this.#editorCommand();
    await runInteractive(editor, [...editorArguments, this.services.profiles.profileFile(profile.name)], process.env);
    this.context.session.prepare(this.services.profiles.get(profile.name));
    this.terminal.success(`cct: '${profile.name}' synced`);
    return 0;
  }

  #editorCommand() {
    const configuredEditor = process.env.VISUAL || process.env.EDITOR;
    if (configuredEditor) return [findExecutable(configuredEditor) ?? configuredEditor, []];
    const vsCode = findExecutable('code');
    if (vsCode) return [vsCode, ['--wait']];
    return isWindows ? ['notepad.exe', []] : ['open', ['-W', '-t']];
  }
}
