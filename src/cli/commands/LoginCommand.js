import { CctError } from '../../core/errors/CctError.js';
import { LOGIN_TARGET_IDS } from '../../core/login/LoginPlanner.js';
import { requireProfileName } from '../ArgumentParser.js';
import { Command, CommandSection } from '../Command.js';
import { askSecret } from '../output/InteractivePrompt.js';

const ALL_TARGETS = 'all';

export class LoginCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['login'],
      section: CommandSection.PROFILES,
      usage: `cct login <profile> [${[...LOGIN_TARGET_IDS, ALL_TARGETS].join('|')}]`,
      summary: 'log in to Claude and the CLIs that are separate in this profile',
    });
  }

  async execute(args) {
    const profile = this.services.profiles.get(requireProfileName(args));
    const requestedTarget = (args[1] ?? ALL_TARGETS).toLowerCase();
    if (requestedTarget !== ALL_TARGETS) return this.#runLogin(profile, this.services.loginPlanner.plan(profile, requestedTarget));

    for (const target of this.services.loginPlanner.availableTargets(profile)) {
      try {
        await this.#runLogin(profile, this.services.loginPlanner.plan(profile, target.id));
      } catch (error) {
        this.terminal.warn(`cct: ${error.message}, skipped`);
      }
    }
    return 0;
  }

  async #runLogin(profile, loginPlan) {
    this.terminal.highlight(`== ${loginPlan.displayName} (${profile.name})${loginPlan.notice ? `: ${loginPlan.notice}` : ''}`);
    if (loginPlan.kind === 'token') return this.#saveToken(profile, loginPlan);
    return this.context.session.run(profile, loginPlan.executable, loginPlan.args);
  }

  async #saveToken(profile, loginPlan) {
    if (!this.terminal.isInteractive) throw new CctError(`${loginPlan.displayName} needs a token typed into an interactive terminal`);
    this.terminal.info(`   Create one at ${loginPlan.createTokenUrl}`);
    const token = await askSecret(this.terminal, `   Paste the ${loginPlan.tokenLabel} (hidden, Enter to save, empty to skip): `);
    if (!token) {
      this.terminal.info('   Skipped.');
      return 0;
    }
    const tokenFile = this.services.toolTokens.save(profile, loginPlan.id, token);
    this.terminal.success(`cct: saved to ${tokenFile}; ${profile.name} now runs ${loginPlan.id} with ${loginPlan.environmentVariable}`);
    return 0;
  }
}
