import { Command, CommandSection } from '../Command.js';

const USAGE_COLUMN_WIDTH = 36;
const LAUNCH_SHORTCUTS = [
  ['cct', 'claude with this folder\'s profile (active shell, then folder binding, then a menu)'],
  ['cct <profile> [claude args]', 'claude as <profile>, e.g. cct work --resume'],
  ['cct -c | cct --resume ...', 'like "cct", passing the arguments to claude'],
];

export class HelpCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['help', '-h', '--help'],
      section: CommandSection.SETUP,
      usage: 'cct help',
      summary: 'show this help',
    });
  }

  async execute() {
    const lines = [`cct ${this.context.version} - several Claude Code accounts (plus gh, git, az, kubectl, npm, aws) side by side`];
    for (const [section, commands] of this.context.registry.groupedBySection()) {
      lines.push('', section);
      if (section === CommandSection.START) {
        for (const [usage, summary] of LAUNCH_SHORTCUTS) lines.push(this.#formatEntry(usage, summary));
      }
      for (const command of commands) lines.push(this.#formatEntry(command.usage, command.summary));
    }
    lines.push('', `Data: ${this.services.appPaths.dataRoot} (set CCT_HOME to move it)`);
    this.terminal.print(lines.join('\n'));
    return 0;
  }

  #formatEntry(usage, summary) {
    if (usage.length < USAGE_COLUMN_WIDTH) return `  ${usage.padEnd(USAGE_COLUMN_WIDTH)}${summary}`;
    return `  ${usage}\n  ${' '.repeat(USAGE_COLUMN_WIDTH)}${summary}`;
  }
}
