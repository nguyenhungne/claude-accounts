const { ExtensionCommand } = require('./ExtensionCommand');

class RefreshCommand extends ExtensionCommand {
  constructor(extension) {
    super(extension, 'cct.refresh');
  }

  async execute() {
    this.extension.refresh();
  }
}

module.exports = { RefreshCommand };
