import {
  ACTIVE_PROFILE_VARIABLE,
  APPLIED_KEYS_VARIABLE,
  BASELINE_VARIABLE,
  BOOKKEEPING_VARIABLES,
  MANAGED_VARIABLES,
} from './EnvironmentVariables.js';

function parseSavedBaseline(serialized) {
  if (!serialized) return null;
  try {
    return JSON.parse(serialized);
  } catch {
    return null;
  }
}

export class EnvironmentBaseline {
  constructor(environment) {
    this.environment = environment;
    this.savedBaseline = parseSavedBaseline(environment[BASELINE_VARIABLE]);
  }

  get activeProfileName() {
    return this.environment[ACTIVE_PROFILE_VARIABLE] || null;
  }

  get previouslyAppliedKeys() {
    return (this.environment[APPLIED_KEYS_VARIABLE] || '').split(';').filter(Boolean);
  }

  originalValue(variableName) {
    if (this.savedBaseline && Object.hasOwn(this.savedBaseline, variableName)) return this.savedBaseline[variableName];
    if (BOOKKEEPING_VARIABLES.includes(variableName)) return null;
    const wasSetByCct = MANAGED_VARIABLES.includes(variableName) || this.previouslyAppliedKeys.includes(variableName);
    if (this.savedBaseline && wasSetByCct) return null;
    return this.environment[variableName] ?? null;
  }
}
