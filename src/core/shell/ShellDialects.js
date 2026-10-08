import { CctError } from '../errors/CctError.js';

const isUnset = value => value == null || value === '';

class PowerShellDialect {
  name = 'pwsh';

  quote(value) {
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  assignment(variableName, value) {
    return isUnset(value)
      ? `Remove-Item Env:${variableName} -ErrorAction SilentlyContinue`
      : `$env:${variableName} = ${this.quote(value)}`;
  }

  launcherCommand(nodeExecutable, entryScript) {
    const node = nodeExecutable === 'node' ? 'node' : this.quote(nodeExecutable);
    return `${node} ${this.quote(entryScript)}`;
  }

  integrationScript(launcher) {
    return [
      'function global:cct {',
      "  if ($args.Count -gt 0 -and ('use', 'reset') -contains $args[0]) {",
      `    $cctAssignments = & ${launcher} @args --emit pwsh | Out-String`,
      '    if ($LASTEXITCODE -eq 0 -and $cctAssignments) { Invoke-Expression $cctAssignments }',
      `  } else { & ${launcher} @args }`,
      '}',
      'if (-not (Get-Variable cctOriginalPrompt -Scope Global -ErrorAction SilentlyContinue)) {',
      '  $global:cctOriginalPrompt = $function:prompt',
      '  function global:prompt {',
      '    $originalPrompt = & $global:cctOriginalPrompt',
      "    if ($env:CCT_PROFILE -and $env:CCT_PROFILE -ne 'default') { \"[cct:$env:CCT_PROFILE] \" + $originalPrompt } else { $originalPrompt }",
      '  }',
      '}',
    ].join('\n');
  }
}

class PosixShellDialect {
  constructor(name) {
    this.name = name;
  }

  quote(value) {
    return `'${String(value).replace(/'/g, "'\\''")}'`;
  }

  assignment(variableName, value) {
    return isUnset(value) ? `unset ${variableName}` : `export ${variableName}=${this.quote(value)}`;
  }

  launcherCommand(nodeExecutable, entryScript) {
    const toPosixPath = filePath => filePath.replace(/\\/g, '/');
    const node = nodeExecutable === 'node' ? 'node' : this.quote(toPosixPath(nodeExecutable));
    return `${node} ${this.quote(toPosixPath(entryScript))}`;
  }

  integrationScript(launcher) {
    return [
      'cct() {',
      '  case "$1" in',
      `    use|reset) cct_assignments="$(${launcher} "$@" --emit sh)" && eval "$cct_assignments"; unset cct_assignments ;;`,
      `    *) ${launcher} "$@" ;;`,
      '  esac',
      '}',
      ...this.promptHook(),
    ].join('\n');
  }

  promptHook() {
    return [];
  }
}

class ZshDialect extends PosixShellDialect {
  constructor() {
    super('zsh');
  }

  promptHook() {
    return [
      'cct_update_prompt() {',
      '  PROMPT="${PROMPT#\\[cct:*\\] }"',
      '  if [[ -n "$CCT_PROFILE" && "$CCT_PROFILE" != default ]]; then PROMPT="[cct:$CCT_PROFILE] $PROMPT"; fi',
      '}',
      'typeset -ag precmd_functions',
      'precmd_functions=(${precmd_functions:#cct_update_prompt} cct_update_prompt)',
    ];
  }
}

class BashDialect extends PosixShellDialect {
  constructor() {
    super('bash');
  }

  promptHook() {
    return [
      'cct_update_prompt() {',
      '  PS1="${PS1#\\[cct:*\\] }"',
      '  if [ -n "$CCT_PROFILE" ] && [ "$CCT_PROFILE" != default ]; then PS1="[cct:$CCT_PROFILE] $PS1"; fi',
      '}',
      'case ";$PROMPT_COMMAND;" in',
      '  *";cct_update_prompt;"*) ;;',
      '  *) PROMPT_COMMAND="cct_update_prompt${PROMPT_COMMAND:+;$PROMPT_COMMAND}" ;;',
      'esac',
    ];
  }
}

const DIALECTS = Object.freeze({
  pwsh: new PowerShellDialect(),
  zsh: new ZshDialect(),
  bash: new BashDialect(),
});

const DIALECT_ALIASES = Object.freeze({ powershell: 'pwsh', sh: 'bash' });

export const SHELL_DIALECT_NAMES = Object.keys(DIALECTS);

export function shellDialect(name) {
  const key = String(name).toLowerCase();
  const dialect = DIALECTS[DIALECT_ALIASES[key] ?? key];
  if (!dialect) throw new CctError(`unknown shell '${name}' (supported: ${SHELL_DIALECT_NAMES.join(', ')})`);
  return dialect;
}

export function renderAssignments(assignments, dialect) {
  return Object.entries(assignments).map(([name, value]) => dialect.assignment(name, value)).join('\n');
}
