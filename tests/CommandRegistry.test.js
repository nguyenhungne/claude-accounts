import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createCommandRegistry } from '../src/cli/createCommandRegistry.js';
import { RESERVED_PROFILE_NAMES } from '../src/core/profiles/ReservedProfileNames.js';

describe('createCommandRegistry', () => {
  const registry = createCommandRegistry({});

  it('reserves every command name so a profile can never shadow a command', () => {
    const commandNames = registry.commands.flatMap(command => command.names).filter(name => !name.startsWith('-'));
    const unreserved = commandNames.filter(name => !RESERVED_PROFILE_NAMES.includes(name));
    assert.deepEqual(unreserved, []);
  });

  it('gives every command a usage line and a summary', () => {
    for (const command of registry.commands) {
      assert.ok(command.usage.startsWith('cct '), `${command.constructor.name} usage`);
      assert.ok(command.summary, `${command.constructor.name} summary`);
    }
  });
});
