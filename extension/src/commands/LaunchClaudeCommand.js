const { ExtensionCommand } = require('./ExtensionCommand');

class LaunchClaudeCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.launchClaude');
  }

  async execute(argument) {
    const profile = await this.resolveProfile(argument, 'Start Claude as...');
    if (!profile) return;
    this.extension.terminals.launchClaude(profile, this.extension.workspaceFolders.current());
  }
}

module.exports = { LaunchClaudeCommand };
