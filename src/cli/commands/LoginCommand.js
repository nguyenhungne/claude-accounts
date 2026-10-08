import { LOGIN_TARGET_IDS } from '../../core/login/LoginPlanner.js';
import { requireProfileName } from '../ArgumentParser.js';
import { Command, CommandSection } from '../Command.js';

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
    return this.context.session.run(profile, loginPlan.executable, loginPlan.args);
  }
}
