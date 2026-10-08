const { ExtensionCommand } = require('./ExtensionCommand');

class OpenProfileTerminalCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.openTerminal');
  }

  async execute(argument) {
    const profile = await this.resolveProfile(argument, 'Open a terminal as...');
    if (!profile) return;
    this.extension.terminals.openShell(profile, this.extension.workspaceFolders.current());
  }
}

module.exports = { OpenProfileTerminalCommand };
