import { spawn, spawnSync } from 'node:child_process';
import { CctError } from '../errors/CctError.js';
import { isWindows } from './Platform.js';

const CMD_SPECIAL_CHARACTERS = /[\s"&|<>^%()!,;=]/;

function quoteForCmd(argument) {
  const text = String(argument);
  return text && !CMD_SPECIAL_CHARACTERS.test(text) ? text : `"${text.replace(/"/g, '""')}"`;
}

function buildSpawnRequest(executable, args) {
  if (isWindows && /\.(cmd|bat)$/i.test(executable)) {
    const commandLine = [executable, ...args].map(quoteForCmd).join(' ');
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', `"${commandLine}"`],
      options: { windowsVerbatimArguments: true },
    };
  }
  return { command: executable, args, options: {} };
}

export function runInteractive(executable, args, environment) {
  return new Promise((resolve, reject) => {
    const request = buildSpawnRequest(executable, args);
    const ignoreInterrupt = () => {};
    process.on('SIGINT', ignoreInterrupt);
    const stopIgnoringInterrupt = () => process.off('SIGINT', ignoreInterrupt);
    const child = spawn(request.command, request.args, { ...request.options, stdio: 'inherit', env: environment });
    child.on('error', error => {
      stopIgnoringInterrupt();
      reject(new CctError(`could not start ${executable}: ${error.message}`));
    });
    child.on('exit', (exitCode, signal) => {
      stopIgnoringInterrupt();
      resolve(exitCode ?? (signal ? 1 : 0));
    });
  });
}

export function runDetached(executable, args, environment) {
  return new Promise((resolve, reject) => {
    const request = buildSpawnRequest(executable, args);
    const child = spawn(request.command, request.args, {
      ...request.options,
      env: environment,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.once('error', error => reject(new CctError(`could not start ${executable}: ${error.message}`)));
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });
}

export function runCaptured(executable, args, { environment = process.env } = {}) {
  const request = buildSpawnRequest(executable, args);
  const result = spawnSync(request.command, request.args, {
    ...request.options,
    env: environment,
    encoding: 'utf8',
    windowsHide: true,
  });
  return { exitCode: result.status ?? 1, output: (result.stdout || '').trim(), errorOutput: (result.stderr || '').trim() };
}
