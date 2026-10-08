import path from 'node:path';
import { EDITOR_FLAVOR_IDS, findEditorFlavor, installedEditorFlavors } from '../../core/editors/EditorFlavors.js';
import { CctError } from '../../core/errors/CctError.js';
import { runInteractive } from '../../core/platform/ProcessRunner.js';
import { parseArguments, requireProfileName } from '../ArgumentParser.js';
import { Command, CommandSection } from '../Command.js';

export class OpenEditorWindowCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['code'],
      section: CommandSection.OTHER_TOOLS,
      usage: `cct code <profile> [folder] [--editor ${EDITOR_FLAVOR_IDS.join('|')}]`,
      summary: 'VS Code or Cursor window whose terminals and Claude extension use the profile',
    });
  }

  async execute(args) {
    const { positionals, options } = parseArguments(args, { aliases: { e: 'editor' } });
    const profile = this.services.profiles.get(requireProfileName(positionals));
    const flavor = this.#chooseFlavor(options.editor);
    this.context.session.prepare(profile);
    const launch = this.services.editorWindows.prepare({ profile, folder: path.resolve(positionals[1] ?? process.cwd()), flavor });
    this.terminal.highlight(`cct: ${flavor.displayName} as '${profile.name}' (separate window state, shared extensions)`);
    return runInteractive(launch.executable, launch.args, launch.environment);
  }

  #chooseFlavor(requestedFlavorId) {
    if (requestedFlavorId) {
      const flavor = findEditorFlavor(requestedFlavorId);
      if (!flavor) throw new CctError(`unknown editor '${requestedFlavorId}' (supported: ${EDITOR_FLAVOR_IDS.join(', ')})`);
      return flavor;
    }
    const [firstInstalled] = installedEditorFlavors();
    if (!firstInstalled) throw new CctError(`no editor command line found (looked for: ${EDITOR_FLAVOR_IDS.join(', ')})`);
    return firstInstalled;
  }
}
