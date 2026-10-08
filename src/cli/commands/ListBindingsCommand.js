import { Command, CommandSection } from '../Command.js';
import { renderTable } from '../output/TableRenderer.js';

export class ListBindingsCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['bindings'],
      section: CommandSection.FOLDERS,
      usage: 'cct bindings',
      summary: 'list folder bindings',
    });
  }

  async execute() {
    const bindings = this.services.bindings.list();
    if (bindings.length === 0) {
      this.terminal.info("No bindings yet. Add one with 'cct bind <profile> [folder]'.");
      return 0;
    }
    this.terminal.print(renderTable(bindings.map(binding => ({ FOLDER: binding.path, PROFILE: binding.profile }))));
    return 0;
  }
}
