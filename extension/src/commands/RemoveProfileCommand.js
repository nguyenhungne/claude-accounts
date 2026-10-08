const { ExtensionCommand } = require('./ExtensionCommand');

const REMOVE = 'Remove';

class RemoveProfileCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.removeProfile');
  }

  async execute(argument) {
    const profile = await this.resolveProfile(argument, 'Remove profile...', { includeDefault: false });
    if (!profile) return;
    const choice = await this.vscode.window.showWarningMessage(
      `Remove the profile '${profile.name}'?`,
      {
        modal: true,
        detail: `This deletes ${this.services.directories.rootOf(profile)}, including its Claude, gh and az logins. `
          + 'Shared memory, skills and plugins in ~/.claude are kept. Tokens are only deleted locally.',
      },
      REMOVE,
    );
    if (choice !== REMOVE) return;
    this.services.lifecycle.remove(profile);
    this.extension.refresh();
    this.vscode.window.showInformationMessage(`Claude Accounts: removed '${profile.name}'.`);
  }
}

module.exports = { RemoveProfileCommand };
