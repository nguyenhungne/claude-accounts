import { CctError } from '../errors/CctError.js';
import { requireExecutable } from '../platform/ExecutableLocator.js';
import { runCaptured } from '../platform/ProcessRunner.js';
import { Profile } from '../profiles/Profile.js';
import { MCP_ITEM_NAME } from '../sharing/SharedClaudeItems.js';

export class McpServerInstaller {
  constructor({ environmentBuilder, runCommand = runCaptured, locateClaude = () => requireExecutable('claude') }) {
    this.environmentBuilder = environmentBuilder;
    this.runCommand = runCommand;
    this.locateClaude = locateClaude;
  }

  ownerOf(profile) {
    return profile.isDefault || profile.sharesClaudeItem(MCP_ITEM_NAME) ? Profile.createDefault() : profile;
  }

  add(profile, server) {
    const owner = this.ownerOf(profile);
    const result = this.runCommand(
      this.locateClaude(),
      ['mcp', 'add', '--transport', server.transport, '--scope', 'user', server.id, server.url],
      { environment: this.environmentBuilder.processEnvironmentFor(owner) },
    );
    if (result.exitCode !== 0) {
      throw new CctError(`could not add ${server.displayName}: ${result.errorOutput || result.output || `exit code ${result.exitCode}`}`);
    }
    return owner;
  }
}
