class ExtensionCommand {
  constructor(extension, commandId) {
    this.extension = extension;
    this.commandId = commandId;
  }

  get vscode() {
    return this.extension.vscode;
  }

  get services() {
    return this.extension.services;
  }

  register() {
    return this.vscode.commands.registerCommand(this.commandId, (...args) => this.run(...args));
  }

  async run(...args) {
    try {
      return await this.execute(...args);
    } catch (error) {
      this.extension.output.appendLine(`${this.commandId}: ${error.stack ?? error.message}`);
      this.vscode.window.showErrorMessage(`Claude Accounts: ${error.message}`);
      return undefined;
    }
  }

  async resolveProfile(argument, placeHolder, { includeDefault = true } = {}) {
    const profileName = typeof argument === 'string' ? argument : argument?.profileName;
    if (profileName) return this.services.profiles.get(profileName);
    return this.extension.profilePicker.pick({ placeHolder, includeDefault });
  }

  async execute() {
    throw new Error(`${this.constructor.name} must implement execute()`);
  }
}

module.exports = { ExtensionCommand };
