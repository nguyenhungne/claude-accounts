import { CctError } from '../../core/errors/CctError.js';
import { splitList } from '../../core/text/Text.js';
import { DEFAULT_ISOLATED_TOOL_IDS, ISOLATED_TOOL_IDS } from '../../core/tools/IsolatedTools.js';
import { SHAREABLE_ITEM_NAMES } from '../../core/sharing/SharedClaudeItems.js';
import { parseArguments } from '../ArgumentParser.js';
import { Command, CommandSection } from '../Command.js';
import { askQuestion } from '../output/InteractivePrompt.js';

const USAGE = `cct add <name> [--tools ${ISOLATED_TOOL_IDS.join(',')}|all|none] [--git-name N] [--git-email E] [--unshare item,...] [--description D] [--yes]`;

export class AddProfileCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['add', 'new'],
      section: CommandSection.PROFILES,
      usage: USAGE,
      summary: 'create a profile',
    });
  }

  async execute(args) {
    const { positionals, options } = parseArguments(args, {
      flags: ['yes'],
      aliases: { t: 'tools', d: 'description', desc: 'description', y: 'yes' },
    });
    const [name] = positionals;
    if (!name) throw new CctError(`usage: ${USAGE}`);
    const nameError = this.services.lifecycle.validateNewName(name);
    if (nameError) throw new CctError(nameError);

    const toolIds = this.#parseToolIds(options.tools);
    const { profile, warnings } = this.services.lifecycle.create({
      name,
      description: options.description ?? '',
      toolIds,
      gitIdentity: await this.#askGitIdentity(options, toolIds),
      unsharedItems: splitList(options.unshare),
    });
    for (const warning of warnings) this.terminal.warn(`cct: [${profile.name}] ${warning}`);
    this.#printNextSteps(profile);
    return 0;
  }

  #parseToolIds(rawTools) {
    if (rawTools === undefined) return DEFAULT_ISOLATED_TOOL_IDS;
    const requested = splitList(rawTools).map(toolId => toolId.toLowerCase());
    if (requested.includes('all')) return ISOLATED_TOOL_IDS;
    if (requested.includes('none')) return [];
    return requested;
  }

  async #askGitIdentity(options, toolIds) {
    const identity = { name: options['git-name'], email: options['git-email'] };
    const shouldAsk = this.terminal.isInteractive && !options.yes && toolIds.includes('git');
    if (shouldAsk && identity.name === undefined) {
      identity.name = await askQuestion(this.terminal, 'git user.name for this profile (Enter = inherit ~/.gitconfig): ');
    }
    if (shouldAsk && identity.email === undefined) {
      identity.email = await askQuestion(this.terminal, 'git user.email for this profile (Enter = inherit ~/.gitconfig): ');
    }
    return identity;
  }

  #printNextSteps(profile) {
    const loginTargets = this.services.loginPlanner.availableTargets(profile).map(target => target.id);
    this.terminal.success(`cct: created '${profile.name}' in ${this.services.directories.rootOf(profile)}`);
    this.terminal.info(`  separate : Claude login${profile.toolIds.length ? `, ${profile.toolIds.join(', ')}` : ''}`);
    this.terminal.info(`  shared   : ${SHAREABLE_ITEM_NAMES.filter(itemName => profile.sharesClaudeItem(itemName)).join(', ')}`);
    this.terminal.info('');
    this.terminal.info('Next:');
    this.terminal.info(`  cct login ${profile.name}            log in to ${loginTargets.join(', ')}`);
    this.terminal.info(`  cct bind ${profile.name} <folder>    use it automatically inside a folder`);
  }
}
