import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDirectory, isFile } from '../fileSystem/FileSystem.js';
import { findExecutable } from '../platform/ExecutableLocator.js';
import { homeDirectory, isWindows } from '../platform/Platform.js';
import { runCaptured } from '../platform/ProcessRunner.js';
import { shellDialect } from './ShellDialects.js';

const BLOCK_START = '# >>> cct >>>';
const BLOCK_END = '# <<< cct <<<';
const BLOCK_PATTERN = new RegExp(`\\r?\\n?${BLOCK_START}[\\s\\S]*?${BLOCK_END}\\r?\\n?`);
export const ENTRY_SCRIPT = fileURLToPath(new URL('../../cli/main.js', import.meta.url));

export class ShellIntegrationInstaller {
  integrationScript(dialect) {
    return dialect.integrationScript(dialect.launcherCommand(this.#nodeExecutable(), ENTRY_SCRIPT));
  }

  install() {
    if (!isWindows) fs.chmodSync(ENTRY_SCRIPT, 0o755);
    return this.#startupFiles().map(({ file, dialect }) => ({
      file,
      changed: this.#writeBlock(file, this.integrationScript(dialect)),
    }));
  }

  uninstall() {
    return this.#startupFiles().map(({ file }) => ({ file, changed: this.#removeBlock(file) }));
  }

  #startupFiles() {
    const startupFiles = this.#powerShellProfiles().map(file => ({ file, dialect: shellDialect('pwsh') }));
    const zshrc = path.join(homeDirectory, '.zshrc');
    const bashrc = path.join(homeDirectory, '.bashrc');
    const loginShell = path.basename(process.env.SHELL || '');
    if (!isWindows && (loginShell === 'zsh' || isFile(zshrc))) startupFiles.push({ file: zshrc, dialect: shellDialect('zsh') });
    if (isFile(bashrc) || (!isWindows && loginShell === 'bash')) startupFiles.push({ file: bashrc, dialect: shellDialect('bash') });
    return startupFiles;
  }

  #powerShellProfiles() {
    const profileFiles = [];
    for (const executableName of ['pwsh', 'powershell']) {
      const powerShell = findExecutable(executableName);
      if (!powerShell) continue;
      const result = runCaptured(powerShell, ['-NoLogo', '-NoProfile', '-Command', '$PROFILE.CurrentUserAllHosts']);
      if (result.exitCode === 0 && result.output) profileFiles.push(result.output);
    }
    return [...new Set(profileFiles)];
  }

  #nodeExecutable() {
    return findExecutable('node') ? 'node' : process.execPath;
  }

  #writeBlock(file, script) {
    const current = isFile(file) ? fs.readFileSync(file, 'utf8') : '';
    const block = `${BLOCK_START}\n${script}\n${BLOCK_END}\n`;
    const separator = current && !current.endsWith('\n') ? '\n' : '';
    const updated = BLOCK_PATTERN.test(current) ? current.replace(BLOCK_PATTERN, `\n${block}`) : `${current}${separator}${block}`;
    if (updated === current) return false;
    ensureDirectory(path.dirname(file));
    fs.writeFileSync(file, updated);
    return true;
  }

  #removeBlock(file) {
    if (!isFile(file)) return false;
    const current = fs.readFileSync(file, 'utf8');
    const updated = current.replace(BLOCK_PATTERN, '\n');
    if (updated === current) return false;
    fs.writeFileSync(file, updated);
    return true;
  }
}
