import path from 'node:path';
import { CctError } from '../../core/errors/CctError.js';
import { isDirectory } from '../../core/fileSystem/FileSystem.js';
import { requireProfileName } from '../ArgumentParser.js';
import { Command, CommandSection } from '../Command.js';

export class BindFolderCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['bind'],
      section: CommandSection.FOLDERS,
      usage: 'cct bind <profile> [folder]',
      summary: 'always use <profile> inside a folder and its subfolders (default: current folder)',
    });
  }

  async execute(args) {
    const profileName = requireProfileName(args);
    if (!this.services.profiles.exists(profileName)) throw new CctError(`profile '${profileName}' not found`);
    const folder = path.resolve(args[1] ?? process.cwd());
    if (!isDirectory(folder)) throw new CctError(`folder not found: ${folder}`);
    const boundFolder = this.services.bindings.bind(folder, profileName);
    this.terminal.success(`cct: ${boundFolder} -> ${profileName}`);
    return 0;
  }
}
