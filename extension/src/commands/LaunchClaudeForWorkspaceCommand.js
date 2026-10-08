const path = require('node:path');
const { ExtensionCommand } = require('./ExtensionCommand');

const ALWAYS_USE = 'Always Use for This Folder';

class LaunchClaudeForWorkspaceCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.launchClaudeForWorkspace');
  }

  async execute() {
    const folder = this.extension.workspaceFolders.current();
    const resolution = folder ? this.services.resolver.resolve(folder) : null;
    if (resolution) {
      this.extension.terminals.launchClaude(this.services.profiles.get(resolution.profileName), folder);
      return;
    }

    const profile = await this.extension.profilePicker.pick({ placeHolder: 'No account is bound to this folder yet. Start Claude as...' });
    if (!profile) return;
    this.extension.terminals.launchClaude(profile, folder);
    if (folder) await this.#offerBinding(profile, folder);
  }

  async #offerBinding(profile, folder) {
    const choice = await this.vscode.window.showInformationMessage(
      `Always start Claude as '${profile.name}' in ${path.basename(folder)}?`,
      ALWAYS_USE,
    );
    if (choice !== ALWAYS_USE) return;
    this.services.bindings.bind(folder, profile.name);
    this.extension.refresh();
  }
}

module.exports = { LaunchClaudeForWorkspaceCommand };
