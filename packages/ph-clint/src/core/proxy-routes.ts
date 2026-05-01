/**
 * Pure functions for building proxy routes from service definitions
 * and Switchboard configuration. No side effects — easily unit-testable.
 */
import type {
  ServiceDefinition,
  ServiceInstanceStatus,
  CaptureDefinition,
  EndpointType,
} from './types.js';

export interface ProxyRoute {
  /** URL path prefix matched against incoming requests (e.g. '/switchboard/graphql'). */
  prefix: string;
  /** Upstream target URL (e.g. new URL('http://localhost:4001/graphql')). */
  upstream: URL;
  /** Whether WebSocket upgrade should be forwarded on this route. */
  ws: boolean;
  /** Origin label for route management (e.g. 'switchboard', 'service:my-svc'). */
  source: string;
}

/** Endpoint types that imply WebSocket transport. */
export function isWsEndpointType(type: EndpointType): boolean {
  return type === 'api-mcp';
}

/**
 * Build proxy routes for the Powerhouse Switchboard layer.
 * Groups all Switchboard endpoints under `/switchboard/`.
 */
export function buildSwitchboardRoutes(
  switchboardUrl: string,
  mcpUrl: string,
): ProxyRoute[] {
  const sbBase = new URL(switchboardUrl);
  const mcpBase = new URL(mcpUrl);

  return [
    {
      prefix: '/switchboard/graphql',
      upstream: new URL('/graphql', sbBase),
      ws: false,
      source: 'switchboard',
    },
    {
      prefix: '/switchboard/d/',
      upstream: new URL('/d/', sbBase),
      ws: false,
      source: 'switchboard',
    },
    {
      prefix: '/switchboard/mcp',
      upstream: new URL('/mcp', mcpBase),
      ws: true,
      source: 'switchboard',
    },
  ];
}

/**
 * Build proxy routes from a service definition's readiness captures.
 * Only captures with announceable endpoint types produce routes.
 */
export function buildServiceRoutes(
  def: ServiceDefinition,
  instance: ServiceInstanceStatus,
): ProxyRoute[] {
  const routes: ProxyRoute[] = [];
  const captures = getCapturesForDef(def);

  for (const [captureName, captureDef] of captures) {
    const captureType = typeof captureDef === 'number'
      ? undefined
      : captureDef.type;
    if (!captureType) continue;

    const url = instance.endpoints?.[captureName];
    if (!url) continue;

    try {
      const upstream = new URL(url);
      // Website endpoints act as catch-all fallback at '/' — they serve
      // SPAs with root-relative asset paths (/assets/*, /icon.ico, etc.)
      const prefix = captureType === 'website'
        ? '/'
        : `/${def.id}/${captureName}`;
      routes.push({
        prefix,
        upstream,
        ws: isWsEndpointType(captureType),
        source: `service:${def.id}`,
      });
    } catch {
      // Skip invalid URLs
    }
  }

  return routes;
}

function getCapturesForDef(
  def: ServiceDefinition,
): Array<[string, number | CaptureDefinition]> {
  const result: Array<[string, number | CaptureDefinition]> = [];
  if (!def.readiness) return result;

  if (def.readiness.captures) {
    for (const [name, capDef] of Object.entries(def.readiness.captures)) {
      result.push([name, capDef]);
    }
  }

  if (def.readiness.patterns) {
    for (const pattern of def.readiness.patterns) {
      if (pattern.captures) {
        for (const [name, capDef] of Object.entries(pattern.captures)) {
          result.push([name, capDef]);
        }
      }
    }
  }

  return result;
}
