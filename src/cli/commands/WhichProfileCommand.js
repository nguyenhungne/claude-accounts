import { normalizeFolderPath } from '../../core/fileSystem/FileSystem.js';
import { Command, CommandSection } from '../Command.js';

export class WhichProfileCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['which'],
      section: CommandSection.FOLDERS,
      usage: 'cct which',
      summary: 'show which profile "cct" would use in this folder',
    });
  }

  async execute() {
    const currentFolder = normalizeFolderPath(process.cwd());
    const binding = this.services.bindings.closestTo(currentFolder);
    const resolution = this.services.resolver.resolve(currentFolder);
    this.terminal.print(`folder  : ${currentFolder}`);
    this.terminal.print(`active  : ${this.services.environmentBaseline.activeProfileName ?? '-'}`);
    this.terminal.print(`binding : ${binding ? `${binding.profile} (from ${binding.path})` : '-'}`);
    this.terminal.print(`cct     : ${resolution ? `starts claude as '${resolution.profileName}'` : 'shows the profile menu'}`);
    return 0;
  }
}
