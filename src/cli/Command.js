export const CommandSection = Object.freeze({
  START: 'Start Claude',
  PROFILES: 'Profiles',
  FOLDERS: 'Folders',
  CONNECTIONS: 'Connections',
  OTHER_TOOLS: 'Other CLIs',
  SETUP: 'Setup',
});

export class Command {
  constructor(context, { names, section, usage, summary }) {
    this.context = context;
    this.names = names;
    this.section = section;
    this.usage = usage;
    this.summary = summary;
  }

  get services() {
    return this.context.services;
  }

  get terminal() {
    return this.context.terminal;
  }

  async execute() {
    throw new Error(`${this.constructor.name} must implement execute()`);
  }
}
