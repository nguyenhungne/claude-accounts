class McpServer {
  constructor({ id, displayName, url, iconId, description }) {
    this.id = id;
    this.displayName = displayName;
    this.url = url;
    this.iconId = iconId;
    this.description = description;
    this.transport = 'http';
  }
}

export const MCP_SERVER_CATALOG = Object.freeze([
  new McpServer({ id: 'clickup', displayName: 'ClickUp', url: 'https://mcp.clickup.com/mcp', iconId: 'checklist', description: 'tasks, docs and comments' }),
  new McpServer({ id: 'notion', displayName: 'Notion', url: 'https://mcp.notion.com/mcp', iconId: 'book', description: 'pages and databases you share with it' }),
  new McpServer({ id: 'slack', displayName: 'Slack', url: 'https://mcp.slack.com/mcp', iconId: 'comment-discussion', description: 'channels, threads and search' }),
  new McpServer({ id: 'atlassian', displayName: 'Atlassian', url: 'https://mcp.atlassian.com/v1/mcp', iconId: 'issues', description: 'Jira and Confluence' }),
  new McpServer({ id: 'linear', displayName: 'Linear', url: 'https://mcp.linear.app/mcp', iconId: 'tasklist', description: 'issues and projects' }),
  new McpServer({ id: 'figma', displayName: 'Figma', url: 'https://mcp.figma.com/mcp', iconId: 'symbol-color', description: 'design files and frames' }),
  new McpServer({ id: 'sentry', displayName: 'Sentry', url: 'https://mcp.sentry.dev/mcp', iconId: 'bug', description: 'errors and issues' }),
]);

export const MCP_SERVER_IDS = MCP_SERVER_CATALOG.map(server => server.id);

export function findMcpServer(serverId) {
  return MCP_SERVER_CATALOG.find(server => server.id === String(serverId).toLowerCase()) ?? null;
}
