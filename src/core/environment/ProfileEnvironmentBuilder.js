import { homeDirectory, isWindows } from '../platform/Platform.js';
import { ISOLATED_TOOLS } from '../tools/IsolatedTools.js';
import {
  ACTIVE_PROFILE_VARIABLE,
  APPLIED_KEYS_VARIABLE,
  BASELINE_VARIABLE,
  BOOKKEEPING_VARIABLES,
  CLAUDE_CONFIG_VARIABLE,
  MANAGED_VARIABLES,
} from './EnvironmentVariables.js';

const ENVIRONMENT_REFERENCE_PATTERN = /%([^%]+)%|\$\{(\w+)\}/g;

function expandReferences(value, environment) {
  return String(value)
    .replace(/^~(?=$|[\\/])/, homeDirectory)
    .replace(ENVIRONMENT_REFERENCE_PATTERN, (reference, windowsName, posixName) => environment[windowsName || posixName] ?? reference);
}

function setVariable(environment, name, value) {
  if (isWindows) {
    for (const existingName of Object.keys(environment)) {
      if (existingName !== name && existingName.toLowerCase() === name.toLowerCase()) delete environment[existingName];
    }
  }
  if (value == null || value === '') delete environment[name];
  else environment[name] = String(value);
}

export function applyAssignments(environment, assignments) {
  const result = { ...environment };
  for (const [name, value] of Object.entries(assignments)) setVariable(result, name, value);
  return result;
}

export class ProfileEnvironmentBuilder {
  constructor(directories, environmentBaseline, environment) {
    this.directories = directories;
    this.environmentBaseline = environmentBaseline;
    this.environment = environment;
  }

  variablesOwnedBy(profile) {
    if (profile.isDefault) return {};
    const profileRoot = this.directories.rootOf(profile);
    const variables = { [CLAUDE_CONFIG_VARIABLE]: this.directories.claudeConfigDirectory(profile) };
    for (const tool of ISOLATED_TOOLS) {
      if (profile.isolates(tool.id)) Object.assign(variables, tool.environmentFor(profileRoot));
    }
    for (const [name, value] of Object.entries(profile.environment)) {
      variables[name] = expandReferences(value, this.environment);
    }
    return variables;
  }

  assignmentsFor(profile) {
    const ownedVariables = this.variablesOwnedBy(profile);
    const originalValues = this.#originalValuesOf([...MANAGED_VARIABLES, ...Object.keys(ownedVariables)]);
    return {
      ...originalValues,
      ...ownedVariables,
      [ACTIVE_PROFILE_VARIABLE]: profile.name,
      [APPLIED_KEYS_VARIABLE]: Object.keys(ownedVariables).join(';') || null,
      [BASELINE_VARIABLE]: JSON.stringify(originalValues),
    };
  }

  resetAssignments() {
    const assignments = this.#originalValuesOf(MANAGED_VARIABLES);
    for (const name of BOOKKEEPING_VARIABLES) assignments[name] = null;
    return assignments;
  }

  processEnvironmentFor(profile) {
    return applyAssignments(this.environment, this.assignmentsFor(profile));
  }

  #originalValuesOf(variableNames) {
    const names = new Set([...variableNames, ...this.environmentBaseline.previouslyAppliedKeys]);
    return Object.fromEntries([...names].map(name => [name, this.environmentBaseline.originalValue(name)]));
  }
}
