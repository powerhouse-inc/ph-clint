import type { ServiceManager } from '../../core/types.js';

/**
 * Module-level cache of MCPClient instances keyed by endpoint URL.
 * Stale clients (endpoint no longer in running services) are disconnected on each call.
 */
const clients = new Map<string, any>();
let connectionCounter = 0;

/**
 * Discover MCP tools from running services that have `api-mcp` endpoints.
 *
 * Queries the ServiceManager for running instances, finds endpoints typed as
 * `api-mcp`, creates/reuses MCPClient connections, and returns the merged tool set.
 *
 * `@mastra/mcp` is dynamically imported so ph-clint doesn't gain a hard dependency.
 */
export async function discoverMcpTools(
  services: ServiceManager,
): Promise<Record<string, any>> {
  const instances = services.list();

  // Collect all api-mcp endpoint URLs from running services
  const activeMcpUrls = new Set<string>();
  for (const inst of instances) {
    if (inst.status !== 'ready') continue;
    if (!inst.endpoints || !inst.endpointTypes) continue;
    for (const [name, type] of Object.entries(inst.endpointTypes)) {
      if (type === 'api-mcp' && inst.endpoints[name]) {
        activeMcpUrls.add(inst.endpoints[name]!);
      }
    }
  }

  // Disconnect stale clients
  for (const [url, client] of clients) {
    if (!activeMcpUrls.has(url)) {
      try { await client.disconnect(); } catch { /* ignore */ }
      clients.delete(url);
    }
  }

  if (activeMcpUrls.size === 0) return {};

  // Lazily import @mastra/mcp (optional peer dependency)
  let MCPClient: any;
  try {
    // @ts-ignore — @mastra/mcp is an optional peer dependency
    const mod = await import('@mastra/mcp');
    MCPClient = mod.MCPClient;
  } catch {
    // @mastra/mcp not installed — no MCP tools available
    return {};
  }

  const allTools: Record<string, any> = {};

  for (const url of activeMcpUrls) {
    let client = clients.get(url);

    if (!client) {
      connectionCounter++;
      client = new MCPClient({
        id: `ph-clint-mcp-${connectionCounter}`,
        servers: {
          [`mcp-${connectionCounter}`]: {
            url: new URL(url),
          },
        },
      });
      clients.set(url, client);
    }

    try {
      const tools = await client.listTools();
      Object.assign(allTools, tools);
    } catch {
      // Tool discovery failed — skip this endpoint
    }
  }

  return allTools;
}

/**
 * Disconnect all cached MCP clients. Call during teardown.
 */
export async function disconnectAllMcp(): Promise<void> {
  for (const [url, client] of clients) {
    try { await client.disconnect(); } catch { /* ignore */ }
    clients.delete(url);
  }
}
