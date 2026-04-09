import type { Logger, ServiceManager } from '../../core/types.js';

/**
 * Module-level cache of MCPClient instances keyed by endpoint URL.
 * Stale clients (endpoint no longer in running services) are disconnected on each call.
 */
const clients = new Map<string, any>();

/**
 * Info about an active MCP endpoint discovered from running services.
 */
interface McpEndpoint {
  url: string;
  serviceId: string;
  instanceId: string;
}

/**
 * Discover MCP tools from running services that have `api-mcp` endpoints.
 *
 * Queries the ServiceManager for running instances, finds endpoints typed as
 * `api-mcp`, creates/reuses MCPClient connections, and returns the merged tool set.
 *
 * Tool names are prefixed with `{serviceId}-mcp__` (e.g. `vetra-mcp__getDocument`).
 * For services with multiple active instances, the instance suffix is included
 * (e.g. `vetra-abc123-mcp__getDocument`).
 *
 * @param MCPClient — Constructor from `@mastra/mcp`, must be provided by the consumer.
 *   Throws if MCP endpoints exist but no MCPClient is provided.
 */
export async function discoverMcpTools(
  services: ServiceManager,
  log?: Logger,
  MCPClient?: any,
): Promise<Record<string, any>> {
  const instances = services.list();

  // Collect all api-mcp endpoint URLs from running services, tracking which service they belong to
  const activeEndpoints: McpEndpoint[] = [];
  for (const inst of instances) {
    if (inst.status !== 'ready') continue;
    if (!inst.endpoints || !inst.endpointTypes) continue;
    for (const [name, type] of Object.entries(inst.endpointTypes)) {
      if (type === 'api-mcp' && inst.endpoints[name]) {
        activeEndpoints.push({
          url: inst.endpoints[name]!,
          serviceId: inst.serviceId,
          instanceId: inst.instanceId,
        });
      }
    }
  }

  const activeUrls = new Set(activeEndpoints.map((ep) => ep.url));

  // Disconnect stale clients
  for (const [url, client] of clients) {
    if (!activeUrls.has(url)) {
      try { await client.disconnect(); } catch { /* ignore */ }
      clients.delete(url);
    }
  }

  if (activeEndpoints.length === 0) {
    log?.debug('[mcp-discover] No active MCP URLs found');
    return {};
  }

  // MCPClient must be provided by the consumer (resolved from their node_modules)
  if (!MCPClient) {
    throw new Error(
      'MCP endpoints found on running services but no MCPClient was provided to getTools(). ' +
      'Pass { MCPClient } from @mastra/mcp, or set { includeMcp: false } to disable MCP discovery.',
    );
  }

  // Count endpoints per service to decide whether to include instance suffix
  const endpointsPerService = new Map<string, number>();
  for (const ep of activeEndpoints) {
    endpointsPerService.set(ep.serviceId, (endpointsPerService.get(ep.serviceId) ?? 0) + 1);
  }

  const allTools: Record<string, any> = {};

  for (const ep of activeEndpoints) {
    let client = clients.get(ep.url);

    if (!client) {
      // Use serviceId as the server key for clean tool naming
      const serverKey = ep.serviceId;
      log?.debug(`[mcp-discover] Connecting to ${ep.url} (service: ${ep.serviceId})`);
      client = new MCPClient({
        id: `ph-clint-mcp-${ep.serviceId}`,
        servers: {
          [serverKey]: {
            url: new URL(ep.url),
          },
        },
      });
      clients.set(ep.url, client);
    }

    try {
      const tools = await client.listTools();
      log?.debug(`[mcp-discover] Got ${Object.keys(tools).length} tools from ${ep.url}`);

      // Determine prefix: serviceId-mcp, or serviceId-instanceSuffix-mcp for multi-instance
      const needsSuffix = (endpointsPerService.get(ep.serviceId) ?? 1) > 1;
      const instanceSuffix = ep.instanceId.includes(':') ? ep.instanceId.split(':')[1] : undefined;
      const prefix = needsSuffix && instanceSuffix
        ? `${ep.serviceId}-${instanceSuffix}-mcp`
        : `${ep.serviceId}-mcp`;

      // Rename tools: strip the MCPClient's server key prefix, add our service prefix
      for (const [rawName, tool] of Object.entries(tools)) {
        // MCPClient prefixes tool names as `{serverKey}_{toolName}`
        const serverKey = ep.serviceId;
        const toolName = rawName.startsWith(`${serverKey}_`)
          ? rawName.slice(serverKey.length + 1)
          : rawName;
        const prefixedName = `${prefix}__${toolName}`;
        allTools[prefixedName] = tool;
      }
    } catch (err) {
      log?.warn(`[mcp-discover] Tool discovery failed for ${ep.url}: ${err instanceof Error ? err.message : err}`);
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
