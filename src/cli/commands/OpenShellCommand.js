import path from 'node:path';
import { findExecutable } from '../../core/platform/ExecutableLocator.js';
import { isWindows } from '../../core/platform/Platform.js';
import { requireProfileName } from '../ArgumentParser.js';
import { Command, CommandSection } from '../Command.js';

export class OpenShellCommand extends Command {
  constructor(context) {
    super(context, {
      names: ['shell'],
      section: CommandSection.OTHER_TOOLS,
      usage: 'cct shell <profile>',
      summary: 'new shell running as the profile, prompt shows [cct:<profile>]',
    });
  }

  async execute(args) {
    const profile = this.services.profiles.get(requireProfileName(args));
    const [shellExecutable, shellArguments] = this.#userShell();
    this.terminal.highlight(`cct: ${path.basename(shellExecutable)} as '${profile.name}', type 'exit' to leave`);
    return this.context.session.run(profile, shellExecutable, shellArguments);
  }

  #userShell() {
    if (!isWindows) return [process.env.SHELL || '/bin/zsh', ['-i']];
    const powerShell = findExecutable('pwsh') ?? findExecutable('powershell');
    return powerShell ? [powerShell, ['-NoLogo']] : [process.env.ComSpec || 'cmd.exe', []];
  }
}
