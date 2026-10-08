const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const CORE_ENTRY_CANDIDATES = [
  path.join(__dirname, '..', '..', 'src', 'core', 'index.js'),
  path.join(__dirname, '..', 'core', 'index.js'),
];

async function loadCore() {
  const coreEntry = CORE_ENTRY_CANDIDATES.find(candidate => fs.existsSync(candidate));
  if (!coreEntry) throw new Error('The cct core library was not found. Run "npm run bundle-core" in the extension folder.');
  return import(pathToFileURL(coreEntry).href);
}

module.exports = { loadCore };
