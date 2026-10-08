import { CctError } from '../errors/CctError.js';
import { findExecutable } from '../platform/ExecutableLocator.js';
import { findIsolatedTool, ISOLATED_TOOLS } from '../tools/IsolatedTools.js';

export const CLAUDE_LOGIN_TARGET = Object.freeze({ id: 'claude', displayName: 'Claude Code', executableName: 'claude' });
const LOGIN_TOOLS = ISOLATED_TOOLS.filter(tool => tool.supportsLogin);
export const LOGIN_TARGET_IDS = Object.freeze([CLAUDE_LOGIN_TARGET.id, ...LOGIN_TOOLS.map(tool => tool.id)]);

export class LoginPlanner {
  availableTargets(profile) {
    const tools = LOGIN_TOOLS.filter(tool => profile.isDefault || profile.isolates(tool.id));
    return [CLAUDE_LOGIN_TARGET, ...tools].map(target => ({ id: target.id, displayName: target.displayName }));
  }

  plan(profile, targetId) {
    if (targetId === CLAUDE_LOGIN_TARGET.id) {
      return {
        kind: 'command',
        ...CLAUDE_LOGIN_TARGET,
        executable: this.#locate(CLAUDE_LOGIN_TARGET),
        args: [],
        notice: 'log in when asked (or type /login), then /exit',
      };
    }
    const tool = findIsolatedTool(targetId);
    if (!tool?.supportsLogin) throw new CctError(`unknown login target '${targetId}' (${LOGIN_TARGET_IDS.join(', ')})`);
    if (!profile.isDefault && !profile.isolates(tool.id)) {
      throw new CctError(`'${tool.id}' is not separate in '${profile.name}', so logging in would switch the default account. Add it to "tools" in profile.json first.`);
    }
    if (tool.usesTokenLoginFor(profile)) {
      return {
        kind: 'token',
        id: tool.id,
        displayName: tool.displayName,
        ...tool.tokenLogin,
        notice: `${tool.displayName} keeps one login per computer, so this profile uses a ${tool.tokenLogin.tokenLabel} (${tool.tokenLogin.environmentVariable})`,
      };
    }
    return {
      kind: 'command',
      id: tool.id,
      displayName: tool.displayName,
      executable: this.#locate(tool),
      args: tool.loginArgumentsFor(profile),
      notice: tool.loginNoticeFor(profile),
    };
  }

  #locate(target) {
    const executable = findExecutable(target.executableName);
    if (!executable) throw new CctError(`${target.displayName} ('${target.executableName}') is not installed or not on PATH`);
    return executable;
  }
}
