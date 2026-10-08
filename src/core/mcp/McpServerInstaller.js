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
    const oauthArguments = server.oauth
      ? ['--client-id', server.oauth.clientId, '--callback-port', String(server.oauth.callbackPort)]
      : [];
    this.#runClaude(owner, `add ${server.displayName}`, [
      'mcp', 'add', '--transport', server.transport, '--scope', 'user', ...oauthArguments, server.id, server.url,
    ]);
    return owner;
  }

  reconfigure(profile, server, configuredName) {
    const owner = this.ownerOf(profile);
    this.#runClaude(owner, `remove the old ${server.displayName} entry`, ['mcp', 'remove', '--scope', 'user', configuredName]);
    return this.add(profile, server);
  }

  #runClaude(owner, action, args) {
    const result = this.runCommand(this.locateClaude(), args, {
      environment: this.environmentBuilder.processEnvironmentFor(owner),
    });
    if (result.exitCode !== 0) {
      throw new CctError(`could not ${action}: ${result.errorOutput || result.output || `exit code ${result.exitCode}`}`);
    }
  }
}
