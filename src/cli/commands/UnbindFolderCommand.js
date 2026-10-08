import { CctError } from '../../core/errors/CctError.js';
import { normalizeFolderPath } from '../../core/fileSystem/FileSystem.js';
import { Command, CommandSection } from '../Command.js';

export class UnbindFolderCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['unbind'],
      section: CommandSection.FOLDERS,
      usage: 'cct unbind [folder]',
      summary: 'remove the binding of a folder',
    });
  }

  async execute(args) {
    const folder = normalizeFolderPath(args[0] ?? process.cwd());
    if (this.services.bindings.unbind(folder)) {
      this.terminal.success(`cct: unbound ${folder}`);
      return 0;
    }
    const inheritedBinding = this.services.bindings.closestTo(folder);
    if (inheritedBinding) {
      throw new CctError(`${folder} has no binding itself; it inherits '${inheritedBinding.profile}' from ${inheritedBinding.path}`);
    }
    throw new CctError(`${folder} has no binding`);
  }
}
