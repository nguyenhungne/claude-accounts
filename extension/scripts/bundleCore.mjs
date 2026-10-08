import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceCore = path.resolve(extensionRoot, '..', 'src', 'core');
const bundledCore = path.join(extensionRoot, 'core');
const packageOutputDirectory = path.join(extensionRoot, 'dist');

fs.rmSync(bundledCore, { recursive: true, force: true });
fs.cpSync(sourceCore, bundledCore, { recursive: true });
fs.writeFileSync(path.join(bundledCore, 'package.json'), `${JSON.stringify({ type: 'module' }, null, 2)}\n`);
fs.mkdirSync(packageOutputDirectory, { recursive: true });
console.log(`bundled ${sourceCore} -> ${bundledCore}`);
