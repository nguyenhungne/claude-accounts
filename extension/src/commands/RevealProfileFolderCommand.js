const { ExtensionCommand } = require('./ExtensionCommand');

class RevealProfileFolderCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.revealProfileFolder');
  }

  async execute(argument) {
    const profile = await this.resolveProfile(argument, 'Reveal the folder of...');
    if (!profile) return;
    const { directories } = this.services;
    const folder = profile.isDefault ? directories.defaultClaudeConfigDirectory() : directories.rootOf(profile);
    await this.vscode.commands.executeCommand('revealFileInOS', this.vscode.Uri.file(folder));
  }
}

module.exports = { RevealProfileFolderCommand };
