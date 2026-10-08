const { ExtensionCommand } = require('./ExtensionCommand');

const OPEN_TOKEN_PAGE = 'Open Token Page';
const PASTE_TOKEN = 'Paste Token';

class LoginCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.login');
  }

  async execute(argument, targetIdArgument) {
    const profile = await this.resolveProfile(argument, 'Log in for profile...');
    if (!profile) return;
    const targets = targetIdArgument ? [{ id: targetIdArgument }] : await this.#chooseTargets(profile);
    const folder = this.extension.workspaceFolders.current();
    for (const target of targets) {
      try {
        const loginPlan = this.services.loginPlanner.plan(profile, target.id);
        if (loginPlan.kind === 'token') await this.#saveToken(profile, loginPlan);
        else this.extension.terminals.runLogin(profile, loginPlan, folder);
      } catch (error) {
        this.vscode.window.showWarningMessage(`Claude Accounts: ${error.message}`);
      }
    }
  }

  async #saveToken(profile, loginPlan) {
    const { window, env, Uri } = this.vscode;
    const choice = await window.showInformationMessage(
      `${loginPlan.notice}. Create one, then paste it here.`,
      OPEN_TOKEN_PAGE,
      PASTE_TOKEN,
    );
    if (!choice) return;
    if (choice === OPEN_TOKEN_PAGE) await env.openExternal(Uri.parse(loginPlan.createTokenUrl));
    const token = await window.showInputBox({
      title: `${loginPlan.displayName} · ${profile.name}`,
      prompt: `Paste the ${loginPlan.tokenLabel}. It is kept in the profile folder and passed as ${loginPlan.environmentVariable}.`,
      password: true,
      ignoreFocusOut: true,
      validateInput: value => (value.trim() ? null : 'Paste a token'),
    });
    if (!token) return;
    this.services.toolTokens.save(profile, loginPlan.id, token);
    this.extension.refresh();
    window.showInformationMessage(`Claude Accounts: '${profile.name}' now runs ${loginPlan.id} with its own token.`);
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
