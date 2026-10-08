const vscode = require('vscode');
const { ClaudeAccountsExtension } = require('./ClaudeAccountsExtension');
const { loadCore } = require('./CoreLoader');

async function activate(context) {
  const core = await loadCore();
  const extension = new ClaudeAccountsExtension({ vscode, context, core });
  extension.start();
  return extension;
}

function deactivate() {}

module.exports = { activate, deactivate };
