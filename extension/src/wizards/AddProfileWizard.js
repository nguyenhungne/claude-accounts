const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
const TITLE = 'New Claude account profile';

class AddProfileWizard {
  constructor(extension) {
    this.extension = extension;
  }

  async run() {
    const name = await this.#askName();
    if (name === undefined) return null;
    const toolIds = await this.#askTools();
    if (toolIds === undefined) return null;
    const gitIdentity = toolIds.includes('git') ? await this.#askGitIdentity() : {};
    if (gitIdentity === undefined) return null;
    const description = await this.#input({
      step: 'description',
      prompt: 'Description shown in the profile list (optional)',
      placeHolder: 'e.g. Personal Max plan',
    });
    if (description === undefined) return null;
    return { name: name.trim(), toolIds, gitIdentity, description: description.trim() };
  }

  #askName() {
    return this.#input({
      step: 'name',
      prompt: 'Profile name. In a terminal it is used as "cct <name>".',
      placeHolder: 'personal',
      validateInput: value => this.extension.services.lifecycle.validateNewName(value),
    });
  }

  async #askTools() {
    const { ISOLATED_TOOLS, DEFAULT_ISOLATED_TOOL_IDS } = this.extension.core;
    const items = ISOLATED_TOOLS.map(tool => ({
      label: tool.displayName,
      description: tool.id,
      picked: DEFAULT_ISOLATED_TOOL_IDS.includes(tool.id),
      toolId: tool.id,
    }));
    const selected = await this.extension.vscode.window.showQuickPick(items, {
      title: `${TITLE}: separate logins`,
      placeHolder: 'CLIs that get their own login in this profile (Claude always does)',
      canPickMany: true,
      ignoreFocusOut: true,
    });
    return selected?.map(item => item.toolId);
  }

  async #askGitIdentity() {
    const name = await this.#input({
      step: 'git name',
      prompt: 'git user.name for commits made in this profile',
      placeHolder: 'Leave empty to keep the name from ~/.gitconfig',
    });
    if (name === undefined) return undefined;
    const email = await this.#input({
      step: 'git email',
      prompt: 'git user.email for commits made in this profile',
      placeHolder: 'Leave empty to keep the email from ~/.gitconfig',
      validateInput: value => (!value || EMAIL_PATTERN.test(value.trim()) ? null : 'Enter an email address or leave it empty'),
    });
    if (email === undefined) return undefined;
    return { name, email };
  }

  #input({ step, prompt, placeHolder, validateInput }) {
    return this.extension.vscode.window.showInputBox({
      title: `${TITLE}: ${step}`,
      prompt,
      placeHolder,
      validateInput,
      ignoreFocusOut: true,
    });
  }
}

module.exports = { AddProfileWizard };
