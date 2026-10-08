import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseArguments, requireProfileName } from '../src/cli/ArgumentParser.js';
import { CctError } from '../src/core/errors/CctError.js';

describe('parseArguments', () => {
  it('separates positionals, valued options, inline values, flags and aliases', () => {
    const { positionals, options } = parseArguments(
      ['work', '--tools', 'gh,git', '--git-email=me@example.com', '-y', '-d', 'Work account'],
      { flags: ['yes'], aliases: { y: 'yes', d: 'description' } },
    );
    assert.deepEqual(positionals, ['work']);
    assert.deepEqual(options, { tools: 'gh,git', 'git-email': 'me@example.com', yes: true, description: 'Work account' });
  });

  it('rejects an option without a value', () => {
    assert.throws(() => parseArguments(['--tools']), CctError);
  });
});

describe('requireProfileName', () => {
  it('lower-cases the first positional and rejects a missing one', () => {
    assert.equal(requireProfileName(['Work']), 'work');
    assert.throws(() => requireProfileName([]), CctError);
  });
});
