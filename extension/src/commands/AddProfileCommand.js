const { AddProfileWizard } = require('../wizards/AddProfileWizard');
const { ExtensionCommand } = require('./ExtensionCommand');

const LOG_IN = 'Log In Now';
const USE_FOR_FOLDER = 'Use for This Folder';

class AddProfileCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.addProfile');
  }

  async execute() {
    const input = await new AddProfileWizard(this.extension).run();
    if (!input) return;
    const { profile, warnings } = this.services.lifecycle.create(input);
    for (const warning of warnings) this.extension.output.appendLine(`[${profile.name}] ${warning}`);
    this.extension.refresh();

    const choice = await this.vscode.window.showInformationMessage(
      `Profile '${profile.name}' created. Skills, MCP servers, plugins and folder memory are shared with your default profile.`,
      LOG_IN,
      USE_FOR_FOLDER,
    );
    if (choice === LOG_IN) await this.vscode.commands.executeCommand('cct.login', profile.name);
    if (choice === USE_FOR_FOLDER) await this.vscode.commands.executeCommand('cct.bindWorkspaceFolder', profile.name);
  }
}

module.exports = { AddProfileCommand };
