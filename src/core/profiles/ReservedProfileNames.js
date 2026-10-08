import { DEFAULT_PROFILE_NAME } from './Profile.js';

export const RESERVED_PROFILE_NAMES = Object.freeze([
  DEFAULT_PROFILE_NAME,
  'add', 'new', 'remove', 'rm', 'list', 'ls', 'status', 'info', 'show', 'run', 'pick', 'login', 'edit', 'sync',
  'bind', 'unbind', 'bindings', 'which', 'exec', 'shell', 'use', 'reset', 'env', 'code', 'connect', 'connections',
  'install', 'uninstall', 'init', 'help', 'version',
]);

export function isReservedProfileName(name) {
  return RESERVED_PROFILE_NAMES.includes(String(name).toLowerCase());
}
