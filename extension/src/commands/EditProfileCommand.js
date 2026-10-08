const { ExtensionCommand } = require('./ExtensionCommand');

class EditProfileCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.editProfile');
  }

  async execute(argument) {
    const profile = await this.resolveProfile(argument, 'Edit the profile.json of...', { includeDefault: false });
    if (!profile) return;
    const profileFile = this.vscode.Uri.file(this.services.profiles.profileFile(profile.name));
    const document = await this.vscode.workspace.openTextDocument(profileFile);
    await this.vscode.window.showTextDocument(document);
    this.vscode.window.setStatusBarMessage('$(info) Claude Accounts: the profile is re-synced when you save this file', 5000);
  }
}

module.exports = { EditProfileCommand };
