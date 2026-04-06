import { MCPClient } from '@mastra/mcp';

let client: MCPClient | null = null;
let connectionCounter = 0;

/**
 * Connect to a reactor project's MCP server.
 * Disconnects any existing client first, then creates a fresh instance
 * with a unique ID to avoid stale cached transports in @mastra/mcp.
 */
export async function connectReactorMcp(mcpServerUrl: string): Promise<void> {
  await disconnectReactorMcp();
  connectionCounter++;
  client = new MCPClient({
    id: `reactor-mcp-${connectionCounter}`,
    servers: {
      'reactor-mcp': {
        url: new URL(mcpServerUrl),
      },
    },
  });
}

/**
 * Disconnect from the reactor project's MCP server.
 */
export async function disconnectReactorMcp(): Promise<void> {
  if (client) {
    try {
      await client.disconnect();
    } catch {
      // Ignore errors during cleanup — the client may already be in a broken state
    }
    client = null;
  }
}

/**
 * Get the current MCPClient's tools (namespaced), or an empty object if not connected.
 */
export async function getReactorMcpTools(): Promise<Record<string, any>> {
  if (!client) return {};
  try {
    return await client.listTools();
  } catch {
    return {};
  }
}
