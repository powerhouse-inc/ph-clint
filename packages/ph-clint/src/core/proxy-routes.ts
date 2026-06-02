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
 * Browser-facing switchboard URLs through the proxy. Kept next to
 * `buildSwitchboardRoutes` so the `/switchboard` prefix scheme has a single
 * owner — a prefix change here updates both the routes and the URLs handed
 * out to consumers.
 */
export function buildSwitchboardProxyUrls(
  proxyUrl: string,
  switchboard: { driveUrl: string },
): { switchboardUrl: string; driveUrl: string; mcpUrl: string } {
  return {
    switchboardUrl: `${proxyUrl}/switchboard/graphql`,
    driveUrl: `${proxyUrl}/switchboard${new URL(switchboard.driveUrl).pathname}`,
    mcpUrl: `${proxyUrl}/switchboard/mcp`,
  };
}

/** A (serviceId, captureName) pair identifying the proxy-root website. */
export interface ProxyRootCapture {
  serviceId: string;
  captureName: string;
}

/**
 * Resolve which website capture implicitly owns the proxy root when none
 * sets `proxyRoot` explicitly. Exactly one website capture across all
 * definitions → that capture (preserves single-SPA behavior for CLIs that
 * predate the flag). Zero, several, or any explicit root → undefined.
 */
export function resolveImplicitProxyRoot(
  defs: ServiceDefinition[],
): ProxyRootCapture | undefined {
  let single: ProxyRootCapture | undefined;
  let count = 0;
  for (const def of defs) {
    for (const [captureName, captureDef] of getCapturesForDef(def)) {
      if (typeof captureDef === 'number') continue;
      if (captureDef.type !== 'website') continue;
      if (captureDef.proxyRoot) return undefined;
      count++;
      single ??= { serviceId: def.id, captureName };
    }
  }
  return count === 1 ? single : undefined;
}

/**
 * Build proxy routes from a service definition's readiness captures.
 * Only captures with announceable endpoint types produce routes.
 */
export function buildServiceRoutes(
  def: ServiceDefinition,
  instance: ServiceInstanceStatus,
  implicitRoot?: ProxyRootCapture,
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
      // Only the proxy-root capture claims the '/' catch-all — the primary
      // SPA whose root-relative asset requests (/assets/*, /icon.ico) must
      // resolve at the proxy root. Either flagged `proxyRoot` explicitly, or
      // the implicit fallback when it is the only website across all
      // services. Every other endpoint, websites included, is routed under
      // its own prefix; prefixed websites must serve themselves under that
      // base path.
      const proxyRoot =
        captureType === 'website' &&
        ((typeof captureDef !== 'number' && captureDef.proxyRoot === true) ||
          (implicitRoot?.serviceId === def.id &&
            implicitRoot.captureName === captureName));
      const prefix = proxyRoot ? '/' : `/${def.id}/${captureName}`;
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
