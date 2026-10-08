const { ExtensionCommand } = require('./ExtensionCommand');

class OpenWindowAsProfileCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.openWindow');
  }

  async execute(argument) {
    const profile = await this.resolveProfile(argument, 'Open a new window as...', { includeDefault: false });
    if (!profile) return;
    const folder = await this.extension.folderPicker.pick({ placeHolder: 'Folder to open in the new window' });
    if (!folder) return;

    const { flavor, cliExecutable } = this.extension.editor;
    this.extension.synchronize(profile);
    const launch = this.services.editorWindows.prepare({ profile, folder, flavor, cliExecutable });
    await this.extension.core.runDetached(launch.executable, launch.args, launch.environment);
    this.vscode.window.showInformationMessage(
      `Opening ${flavor.displayName} as '${profile.name}'. Terminals and the Claude extension in that window use this account.`,
    );
  }
}

module.exports = { OpenWindowAsProfileCommand };
