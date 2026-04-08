import { MCPClient } from '@mastra/mcp';

let client: MCPClient | null = null;
let connectionCounter = 0;

/**
 * Connect to a Vetra project's MCP server.
 * Disconnects any existing client first, then creates a fresh instance
 * with a unique ID to avoid stale cached transports in @mastra/mcp.
 */
export async function connectMcp(mcpServerUrl: string): Promise<void> {
  await disconnectMcp();
  connectionCounter++;
  client = new MCPClient({
    id: `vetra-mcp-${connectionCounter}`,
    servers: {
      'vetra-mcp': {
        url: new URL(mcpServerUrl),
      },
    },
  });
}

/**
 * Disconnect from the Vetra project's MCP server.
 */
export async function disconnectMcp(): Promise<void> {
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
export async function getMcpTools(): Promise<Record<string, any>> {
  if (!client) return {};
  try {
    return await client.listTools();
  } catch {
    return {};
  }
}
