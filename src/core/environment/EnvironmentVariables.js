import { ISOLATED_TOOLS } from '../tools/IsolatedTools.js';

export const CLAUDE_CONFIG_VARIABLE = 'CLAUDE_CONFIG_DIR';
export const ACTIVE_PROFILE_VARIABLE = 'CCT_PROFILE';
export const APPLIED_KEYS_VARIABLE = 'CCT_KEYS';
export const BASELINE_VARIABLE = 'CCT_BASELINE';
export const DATA_ROOT_VARIABLE = 'CCT_HOME';

export const BOOKKEEPING_VARIABLES = Object.freeze([ACTIVE_PROFILE_VARIABLE, APPLIED_KEYS_VARIABLE, BASELINE_VARIABLE]);

export const MANAGED_VARIABLES = Object.freeze([
  CLAUDE_CONFIG_VARIABLE,
  ...ISOLATED_TOOLS.flatMap(tool => tool.environmentVariableNames),
]);
