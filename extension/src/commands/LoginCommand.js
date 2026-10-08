const { ExtensionCommand } = require('./ExtensionCommand');

class LoginCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.login');
  }

  async execute(argument) {
    const profile = await this.resolveProfile(argument, 'Log in for profile...');
    if (!profile) return;
    const targets = await this.#chooseTargets(profile);
    const folder = this.extension.workspaceFolders.current();
    for (const target of targets) {
      try {
        this.extension.terminals.runLogin(profile, this.services.loginPlanner.plan(profile, target.id), folder);
      } catch (error) {
        this.vscode.window.showWarningMessage(`Claude Accounts: ${error.message}`);
      }
    }
  }

  async #chooseTargets(profile) {
    const targets = this.services.loginPlanner.availableTargets(profile);
    if (targets.length === 1) return targets;
    const selected = await this.vscode.window.showQuickPick(
      targets.map(target => ({ label: target.displayName, description: target.id, picked: true, target })),
      { placeHolder: `Log in to... (each opens its own terminal as '${profile.name}')`, canPickMany: true },
    );
    return selected?.map(item => item.target) ?? [];
  }
}

module.exports = { LoginCommand };
