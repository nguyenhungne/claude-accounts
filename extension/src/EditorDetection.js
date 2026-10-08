const fs = require('node:fs');
const path = require('node:path');

const CLI_SUFFIX = process.platform === 'win32' ? '.cmd' : '';

function detectCurrentEditor(vscode, core) {
  const flavorId = /cursor/i.test(vscode.env.appName) ? 'cursor' : 'code';
  const flavor = core.findEditorFlavor(flavorId);
  const bundledCliCandidates = [
    path.join(vscode.env.appRoot, 'bin', flavor.cliName + CLI_SUFFIX),
    path.join(vscode.env.appRoot, '..', '..', 'bin', flavor.cliName + CLI_SUFFIX),
  ];
  const bundledCli = bundledCliCandidates.find(candidate => fs.existsSync(candidate));
  return { flavor, cliExecutable: bundledCli ?? flavor.locateCli() };
}

module.exports = { detectCurrentEditor };
