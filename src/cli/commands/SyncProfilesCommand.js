import { Command, CommandSection } from '../Command.js';

export class SyncProfilesCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['sync'],
      section: CommandSection.PROFILES,
      usage: 'cct sync [profile]',
      summary: 're-create links, gitconfig and the MCP sync now (also happens on every launch)',
    });
  }

  async execute(args) {
    const profiles = args.length
      ? [this.services.profiles.get(args[0])]
      : this.services.profiles.list().filter(profile => !profile.isDefault);
    for (const profile of profiles) {
      this.context.session.prepare(profile);
      this.terminal.success(`cct: '${profile.name}' synced`);
    }
    return 0;
  }
}
