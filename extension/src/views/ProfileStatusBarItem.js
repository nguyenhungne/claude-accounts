const os = require('node:os');

const STATUS_BAR_PRIORITY = 100;

class ProfileStatusBarItem {
  constructor(extension) {
    this.extension = extension;
    const { window, StatusBarAlignment } = extension.vscode;
    this.item = window.createStatusBarItem('cct.currentProfile', StatusBarAlignment.Left, STATUS_BAR_PRIORITY);
    this.item.name = 'Claude Account';
    this.item.command = 'cct.launchClaudeForWorkspace';
  }

  update() {
    if (!this.extension.configuration.get('showStatusBarItem', true)) {
      this.item.hide();
      return;
    }
    try {
      this.#render();
    } catch (error) {
      this.item.text = '$(account) $(error)';
      this.item.tooltip = `Claude Accounts: ${error.message}`;
    }
    this.item.show();
  }

  dispose() {
    this.item.dispose();
  }

  #render() {
    const { services, workspaceFolders, vscode } = this.extension;
    const folder = workspaceFolders.current() ?? os.homedir();
    const resolution = services.resolver.resolve(folder);
    if (!resolution) {
      this.item.text = '$(account) Claude: choose account';
      this.item.tooltip = 'No Claude account is bound to this folder. Click to choose one and start Claude.';
      return;
    }
    const profile = services.profiles.get(resolution.profileName);
    const account = services.accounts.claudeAccount(profile);
    this.item.text = `$(account) ${profile.name}${account ? '' : ' $(warning)'}`;
    const tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown(`**Claude account for this folder: ${profile.name}**\n\n`);
    tooltip.appendMarkdown(`${account ?? 'Not logged in yet'} · ${resolution.reason}\n\n`);
    tooltip.appendMarkdown('Click to start Claude.');
    this.item.tooltip = tooltip;
  }
}

module.exports = { ProfileStatusBarItem };
