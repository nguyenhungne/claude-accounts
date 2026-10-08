import { runInteractive } from '../core/platform/ProcessRunner.js';

export class ProfileSession {
  constructor({ services, terminal }) {
    this.services = services;
    this.terminal = terminal;
  }

  prepare(profile) {
    for (const warning of this.services.synchronizer.synchronize(profile)) {
      this.terminal.warn(`cct: [${profile.name}] ${warning}`);
    }
  }

  environmentFor(profile) {
    return this.services.environmentBuilder.processEnvironmentFor(profile);
  }

  run(profile, executable, args) {
    this.prepare(profile);
    return runInteractive(executable, args, this.environmentFor(profile));
  }
}
