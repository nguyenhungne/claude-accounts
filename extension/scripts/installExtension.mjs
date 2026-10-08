import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITOR_FLAVOR_IDS, findEditorFlavor, installedEditorFlavors } from '../../src/core/editors/EditorFlavors.js';
import { runInteractive } from '../../src/core/platform/ProcessRunner.js';

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagedExtension = path.join(extensionRoot, 'dist', 'claude-accounts.vsix');
const requestedEditorIndex = process.argv.indexOf('--editor');
const requestedEditorId = requestedEditorIndex === -1 ? null : process.argv[requestedEditorIndex + 1];

function targetEditors() {
  if (!requestedEditorId) return installedEditorFlavors();
  const flavor = findEditorFlavor(requestedEditorId);
  if (!flavor) throw new Error(`unknown editor '${requestedEditorId}' (supported: ${EDITOR_FLAVOR_IDS.join(', ')})`);
  return [flavor];
}

async function installInto(flavor) {
  const cli = flavor.locateCli();
  if (!cli) {
    console.error(`${flavor.displayName}: command line '${flavor.cliName}' not found, skipped`);
    return false;
  }
  const exitCode = await runInteractive(cli, ['--install-extension', packagedExtension, '--force'], process.env);
  console.log(`${flavor.displayName}: ${exitCode === 0 ? 'installed' : `failed (exit ${exitCode})`}`);
  return exitCode === 0;
}

const editors = targetEditors();
if (editors.length === 0) {
  console.error(`No editor command line found (looked for: ${EDITOR_FLAVOR_IDS.join(', ')}).`);
  process.exitCode = 1;
} else {
  const results = [];
  for (const editor of editors) results.push(await installInto(editor));
  process.exitCode = results.every(Boolean) ? 0 : 1;
  console.log('Reload the editor window to activate "Claude Accounts".');
}
