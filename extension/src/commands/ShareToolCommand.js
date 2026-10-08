const { ExtensionCommand } = require('./ExtensionCommand');

const USE_NORMAL_LOGIN = 'Use Normal Login';

class ShareToolCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.shareTool');
  }

  async execute(item) {
    const profile = this.services.profiles.get(item.profileName);
    const choice = await this.vscode.window.showWarningMessage(
      `Let '${profile.name}' use your normal ${item.label ?? item.toolId} login?`,
      { modal: true, detail: 'Its own login stays in the profile folder and comes back if you make it separate again.' },
      USE_NORMAL_LOGIN,
    );
    if (choice !== USE_NORMAL_LOGIN) return;
    this.services.lifecycle.setToolSeparate(profile, item.toolId, false);
    this.extension.refresh();
  }
}

module.exports = { ShareToolCommand };
