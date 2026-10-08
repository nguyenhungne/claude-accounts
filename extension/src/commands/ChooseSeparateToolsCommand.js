const { ExtensionCommand } = require('./ExtensionCommand');

class ChooseSeparateToolsCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.chooseSeparateTools');
  }

  async execute(argument) {
    const profile = await this.resolveProfile(argument, 'Choose separate CLIs for profile...', { includeDefault: false });
    if (!profile) return;
    const selected = await this.vscode.window.showQuickPick(
      this.extension.core.ISOLATED_TOOLS.map(tool => ({
        label: tool.displayName,
        description: tool.tokenLogin ? `${tool.id} · signs in with a token` : tool.id,
        picked: profile.isolates(tool.id),
        toolId: tool.id,
      })),
      {
        title: `Separate CLIs for '${profile.name}'`,
        placeHolder: 'Ticked CLIs get their own login in this profile. Unticked ones use your normal login.',
        canPickMany: true,
        ignoreFocusOut: true,
      },
    );
    if (!selected) return;
    const { profile: updated, warnings } = this.services.lifecycle.changeTools(profile, selected.map(item => item.toolId));
    for (const warning of warnings) this.extension.output.appendLine(`[${updated.name}] ${warning}`);
    this.extension.refresh();

    const needsLogin = this.services.loginPlanner.availableTargets(updated).filter(({ id }) => id !== 'claude' && !profile.isolates(id));
    if (needsLogin.length === 0) return;
    const choice = await this.vscode.window.showInformationMessage(
      `'${updated.name}' now has its own ${needsLogin.map(({ displayName }) => displayName).join(', ')}. Log in now?`,
      'Log In',
    );
    if (choice) for (const { id } of needsLogin) await this.vscode.commands.executeCommand('cct.login', updated.name, id);
  }
}

module.exports = { ChooseSeparateToolsCommand };
