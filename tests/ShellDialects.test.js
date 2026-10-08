import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CctError } from '../src/core/errors/CctError.js';
import { renderAssignments, shellDialect } from '../src/core/shell/ShellDialects.js';

const ASSIGNMENTS = { GH_CONFIG_DIR: "C:\\Users\\O'Neil\\gh", AZURE_CONFIG_DIR: null };

describe('shellDialect', () => {
  it('renders PowerShell assignments with escaped quotes', () => {
    assert.equal(
      renderAssignments(ASSIGNMENTS, shellDialect('pwsh')),
      "$env:GH_CONFIG_DIR = 'C:\\Users\\O''Neil\\gh'\nRemove-Item Env:AZURE_CONFIG_DIR -ErrorAction SilentlyContinue",
    );
  });

  it('renders POSIX assignments with escaped quotes', () => {
    assert.equal(
      renderAssignments(ASSIGNMENTS, shellDialect('zsh')),
      "export GH_CONFIG_DIR='C:\\Users\\O'\\''Neil\\gh'\nunset AZURE_CONFIG_DIR",
    );
  });

  it('accepts aliases and rejects unknown shells', () => {
    assert.equal(shellDialect('powershell').name, 'pwsh');
    assert.equal(shellDialect('sh').name, 'bash');
    assert.throws(() => shellDialect('fish'), CctError);
  });

  it('wraps use and reset in the integration function', () => {
    const script = shellDialect('bash').integrationScript("node '/opt/cct/src/cli/main.js'");
    assert.match(script, /use\|reset\) cct_assignments="\$\(node '\/opt\/cct\/src\/cli\/main\.js' "\$@" --emit sh\)"/);
  });
});
