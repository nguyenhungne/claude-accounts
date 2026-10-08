import path from 'node:path';
import { isFile, readJsonFile } from '../fileSystem/FileSystem.js';
import { isMac } from '../platform/Platform.js';
import { Profile } from '../profiles/Profile.js';
import { MCP_ITEM_NAME } from '../sharing/SharedClaudeItems.js';
import { MCP_SERVER_CATALOG } from './McpServerCatalog.js';

export const McpConnectionState = Object.freeze({
  NOT_ADDED: 'not added',
  NOT_CONNECTED: 'not connected',
  CONNECTED: 'connected',
  UNKNOWN: 'added, sign-in state unknown',
});

export class McpConnectionInspector {
  constructor(directories) {
    this.directories = directories;
  }

  describeAll(profile) {
    const configuredServers = this.#configuredServers(profile);
    const signedInServerNames = this.#signedInServerNames(profile);
    return MCP_SERVER_CATALOG.map(server => {
      const configuredName = this.#configuredNameOf(server, configuredServers);
      return { server, configuredName, state: this.#stateOf(configuredName, signedInServerNames) };
    });
  }

  #stateOf(configuredName, signedInServerNames) {
    if (!configuredName) return McpConnectionState.NOT_ADDED;
    if (signedInServerNames === null) return McpConnectionState.UNKNOWN;
    return signedInServerNames.has(configuredName) ? McpConnectionState.CONNECTED : McpConnectionState.NOT_CONNECTED;
  }

  #configuredNameOf(server, configuredServers) {
    const entries = Object.entries(configuredServers);
    const sameUrl = entries.find(([, definition]) => definition?.url === server.url);
    if (sameUrl) return sameUrl[0];
    return Object.hasOwn(configuredServers, server.id) ? server.id : null;
  }

  #configuredServers(profile) {
    const ownServers = readJsonFile(this.directories.claudeStateFile(profile), { tolerateInvalid: true })?.mcpServers ?? {};
    if (profile.isDefault || !profile.sharesClaudeItem(MCP_ITEM_NAME)) return ownServers;
    const defaultServers = readJsonFile(this.directories.claudeStateFile(Profile.createDefault()), { tolerateInvalid: true })?.mcpServers ?? {};
    return { ...ownServers, ...defaultServers };
  }

  #signedInServerNames(profile) {
    const credentialsFile = path.join(this.directories.claudeConfigDirectory(profile), '.credentials.json');
    if (!isFile(credentialsFile)) return isMac ? null : new Set();
    const tokens = readJsonFile(credentialsFile, { tolerateInvalid: true })?.mcpOAuth ?? {};
    const signedIn = Object.entries(tokens)
      .filter(([, token]) => token?.accessToken || token?.refreshToken)
      .map(([key]) => key.slice(0, key.lastIndexOf('|')));
    return new Set(signedIn);
  }
}
