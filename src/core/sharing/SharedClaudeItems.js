export const SHARED_CLAUDE_DIRECTORIES = Object.freeze([
  'projects',
  'skills',
  'agents',
  'commands',
  'output-styles',
  'plugins',
  'plans',
  'todos',
  'file-history',
  'ide',
]);

export const SHARED_CLAUDE_FILES = Object.freeze([
  { name: 'settings.json', initialContent: '{}\n' },
  { name: 'CLAUDE.md', initialContent: null },
  { name: 'keybindings.json', initialContent: null },
  { name: 'history.jsonl', initialContent: '' },
]);

export const MCP_ITEM_NAME = 'mcp';
export const SETTINGS_FILE_NAME = 'settings.json';

export const SHAREABLE_ITEM_NAMES = Object.freeze([
  ...SHARED_CLAUDE_FILES.map(file => file.name),
  ...SHARED_CLAUDE_DIRECTORIES,
  MCP_ITEM_NAME,
]);

export function canonicalItemName(itemName) {
  return SHAREABLE_ITEM_NAMES.find(name => name.toLowerCase() === String(itemName).toLowerCase()) ?? null;
}
