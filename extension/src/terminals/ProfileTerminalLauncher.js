class ProfileTerminalLauncher {
  constructor(extension) {
    this.extension = extension;
    this.ownTerminals = new Set();
  }

  launchClaude(profile, folder, { message } = {}) {
    const { vscode } = this.extension;
    const location = this.extension.configuration.get('claudeTerminalLocation', 'editor') === 'editor'
      ? vscode.TerminalLocation.Editor
      : vscode.TerminalLocation.Panel;
    return this.#open(profile, {
      name: `Claude · ${profile.name}`,
      shellPath: this.extension.core.requireExecutable('claude'),
      cwd: folder ?? undefined,
      location,
      message,
      iconPath: new vscode.ThemeIcon('sparkle'),
    });
  }

  openShell(profile, folder) {
    return this.#open(profile, {
      name: `Shell · ${profile.name}`,
      cwd: folder ?? undefined,
      iconPath: new this.extension.vscode.ThemeIcon('terminal'),
    });
  }

  runLogin(profile, loginPlan, folder) {
    return this.#open(profile, {
      name: `${loginPlan.displayName} login · ${profile.name}`,
      shellPath: loginPlan.executable,
      shellArgs: loginPlan.args,
      cwd: folder ?? undefined,
      message: loginPlan.notice ? `${loginPlan.displayName}: ${loginPlan.notice}` : undefined,
      iconPath: new this.extension.vscode.ThemeIcon('sign-in'),
    });
  }

  forget(terminal) {
    return this.ownTerminals.delete(terminal);
  }

  #open(profile, options) {
    const { vscode, services } = this.extension;
    this.extension.synchronize(profile);
    const terminal = vscode.window.createTerminal({
      ...options,
      env: services.environmentBuilder.assignmentsFor(profile),
      color: new vscode.ThemeColor('terminal.ansiCyan'),
    });
    this.ownTerminals.add(terminal);
    terminal.show();
    return terminal;
  }
}

module.exports = { ProfileTerminalLauncher };
