const { ExtensionCommand } = require('./ExtensionCommand');

class MakeToolSeparateCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.makeToolSeparate');
  }

  async execute(item) {
    const profile = this.services.profiles.get(item.profileName);
    const { profile: updated, warnings } = this.services.lifecycle.setToolSeparate(profile, item.toolId, true);
    for (const warning of warnings) this.extension.output.appendLine(`[${updated.name}] ${warning}`);
    this.extension.refresh();
    const canLogIn = this.services.loginPlanner.availableTargets(updated).some(({ id }) => id === item.toolId);
    if (canLogIn) await this.vscode.commands.executeCommand('cct.login', updated.name, item.toolId);
  }
}

module.exports = { MakeToolSeparateCommand };
