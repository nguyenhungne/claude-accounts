import { Command, CommandSection } from '../Command.js';

export class PickProfileCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['pick'],
      section: CommandSection.START,
      usage: 'cct pick [claude args]',
      summary: 'always choose the profile from a menu',
    });
  }

  async execute(args) {
    return this.context.launcher.chooseAndLaunch(args);
  }
}
