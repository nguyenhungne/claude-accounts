import { SHARED_CLAUDE_DIRECTORIES, SHARED_CLAUDE_FILES, MCP_ITEM_NAME } from '../../core/sharing/SharedClaudeItems.js';
import { requireProfileName } from '../ArgumentParser.js';
import { Command, CommandSection } from '../Command.js';

const ITEM_COLUMN_WIDTH = 16;

export class ShowProfileCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['info', 'show'],
      section: CommandSection.PROFILES,
      usage: 'cct info <profile>',
      summary: 'environment variables and what is shared or separate',
    });
  }

  async execute(args) {
    const profile = this.services.profiles.get(requireProfileName(args));
    this.#printSummary(profile);
    this.#printEnvironment(profile);
    if (!profile.isDefault) this.#printClaudeItems(profile);
    return 0;
  }

  #printSummary(profile) {
    const { accounts, directories } = this.services;
    const folder = profile.isDefault ? directories.defaultClaudeConfigDirectory() : directories.rootOf(profile);
    this.terminal.print(`profile   : ${profile.name}${profile.description ? ` - ${profile.description}` : ''}`);
    this.terminal.print(`folder    : ${folder}`);
    this.terminal.print(`claude    : ${accounts.claudeAccount(profile) ?? '-'}`);
    this.terminal.print(`github    : ${accounts.githubUser(profile) ?? '-'}`);
    this.terminal.print(`git email : ${accounts.gitEmail(profile) ?? '-'}`);
  }

  #printEnvironment(profile) {
    const ownedVariables = Object.entries(this.services.environmentBuilder.variablesOwnedBy(profile));
    this.terminal.print('');
    this.terminal.print('environment:');
    if (ownedVariables.length === 0) this.terminal.print('  (none, uses your normal environment)');
    for (const [name, value] of ownedVariables) this.terminal.print(`  ${name}=${value}`);
  }

  #printClaudeItems(profile) {
    this.terminal.print('');
    this.terminal.print('claude items:');
    const itemNames = [...SHARED_CLAUDE_FILES.map(file => file.name), ...SHARED_CLAUDE_DIRECTORIES];
    for (const itemName of itemNames) {
      const unsharedNote = profile.sharesClaudeItem(itemName) ? '' : ' (unshared in profile.json)';
      this.terminal.print(`  ${itemName.padEnd(ITEM_COLUMN_WIDTH)} ${this.services.linker.describe(profile, itemName)}${unsharedNote}`);
    }
    const mcpState = profile.sharesClaudeItem(MCP_ITEM_NAME) ? 'synced from default on every launch' : 'separate';
    this.terminal.print(`  ${MCP_ITEM_NAME.padEnd(ITEM_COLUMN_WIDTH)} ${mcpState}`);
  }
}
