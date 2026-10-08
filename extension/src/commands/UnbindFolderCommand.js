const { ExtensionCommand } = require('./ExtensionCommand');

class UnbindFolderCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.unbindFolder');
  }

  async execute(argument) {
    const folder = argument?.folderPath ?? await this.extension.folderPicker.pick({ placeHolder: 'Remove the binding of which folder?' });
    if (!folder) return;
    if (this.services.bindings.unbind(folder)) {
      this.extension.refresh();
      this.vscode.window.showInformationMessage(`Claude Accounts: ${folder} no longer has its own profile.`);
      return;
    }
    const inherited = this.services.bindings.closestTo(folder);
    this.vscode.window.showInformationMessage(inherited
      ? `Claude Accounts: ${folder} has no binding itself. It inherits '${inherited.profile}' from ${inherited.path}.`
      : `Claude Accounts: ${folder} has no binding.`);
  }
}

module.exports = { UnbindFolderCommand };
