#!/usr/bin/env node
import fs from 'node:fs';
import { createServices } from '../core/createServices.js';
import { CctError } from '../core/errors/CctError.js';
import { ClaudeLauncher } from './ClaudeLauncher.js';
import { createCommandRegistry } from './createCommandRegistry.js';
import { Terminal } from './output/Terminal.js';
import { ProfileSession } from './ProfileSession.js';

const packageManifest = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

function createContext() {
  const terminal = new Terminal();
  const services = createServices();
  const session = new ProfileSession({ services, terminal });
  const launcher = new ClaudeLauncher({ services, terminal, session });
  const context = { terminal, services, session, launcher, version: packageManifest.version };
  createCommandRegistry(context);
  return context;
}

async function dispatch(context, args) {
  const { registry, launcher, services } = context;
  if (args.length === 0) return launcher.launchForCurrentFolder([]);

  const [firstArgument, ...remainingArguments] = args;
  const command = registry.find(firstArgument);
  if (command) return command.execute(remainingArguments);
  if (firstArgument.startsWith('-')) return launcher.launchForCurrentFolder(args);
  if (services.profiles.exists(firstArgument)) return launcher.launch(services.profiles.get(firstArgument), remainingArguments);
  throw new CctError(`unknown command or profile '${firstArgument}' (see: cct help)`);
}

const context = createContext();
try {
  process.exitCode = (await dispatch(context, process.argv.slice(2))) ?? 0;
} catch (error) {
  context.terminal.error(error instanceof CctError ? `cct: ${error.message}` : `cct: ${error.stack ?? error}`);
  process.exitCode = 1;
}
