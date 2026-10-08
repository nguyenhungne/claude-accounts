const path = require('node:path');
const { ExtensionCommand } = require('./ExtensionCommand');

class BindWorkspaceFolderCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.bindWorkspaceFolder');
  }

  async execute(argument) {
    const profile = await this.resolveProfile(argument, 'Use which profile for a folder?');
    if (!profile) return;
    const folder = await this.extension.folderPicker.pick({ placeHolder: `Folder that should always use '${profile.name}'` });
    if (!folder) return;
    const boundFolder = this.services.bindings.bind(folder, profile.name);
    this.extension.refresh();
    this.vscode.window.showInformationMessage(
      `Claude now starts as '${profile.name}' in ${path.basename(boundFolder)} and its subfolders.`,
    );
  }
}

module.exports = { BindWorkspaceFolderCommand };
