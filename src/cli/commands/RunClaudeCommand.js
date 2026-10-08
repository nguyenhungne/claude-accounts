import { Command, CommandSection } from '../Command.js';

export class RunClaudeCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['run'],
      section: CommandSection.START,
      usage: 'cct run [profile] [claude args]',
      summary: 'long form of "cct" and "cct <profile>"',
    });
  }

  async execute(args) {
    const [firstArgument, ...claudeArguments] = args;
    if (firstArgument && !firstArgument.startsWith('-')) {
      return this.context.launcher.launch(this.services.profiles.get(firstArgument), claudeArguments);
    }
    return this.context.launcher.launchForCurrentFolder(args);
  }
}
