/**
 * Embedded reverse proxy — exposes all service endpoints through a single port.
 * Uses http-proxy for HTTP + WebSocket forwarding.
 */
import http from 'node:http';
import httpProxy from 'http-proxy';
import type { Logger } from './types.js';
import type { ProxyRoute } from './proxy-routes.js';

export interface ProxyServerOptions {
  /** Port to listen on (0 = auto-assign). */
  port: number;
  /** Bind address (default '0.0.0.0'). */
  host: string;
  /**
   * Browser-facing base URL when the proxy sits behind an ingress /
   * reverse proxy (e.g. `https://vetra-agent.<tenant>.vetra.io`). When
   * set, `url` returns this instead of the local listen address, so
   * everything composed from it (the ready event's proxied switchboard /
   * drive / mcp URLs) is reachable from outside the pod.
   */
  publicUrl?: string;
  logger: Logger;
}

export interface ProxyServerInstance {
  readonly port: number;
  readonly host: string;
  readonly url: string;
  addRoute(route: ProxyRoute): void;
  removeRoutesBySource(source: string): void;
  getRoutes(): ReadonlyArray<Readonly<ProxyRoute>>;
  stop(): Promise<void>;
}


  /**
   * Compute the X-Forwarded-Prefix value to send upstream.
   */
  function computeForwardedPrefix(route: ProxyRoute): string | undefined {
    const strip = (s: string) => s.replace(/\/$/, '');
    const prefix = strip(route.prefix);
    const upstreamPath = strip(route.upstream.pathname);
    const result = upstreamPath && prefix.endsWith(upstreamPath) ? prefix.slice(0, -upstreamPath.length) : prefix;
    return result || undefined;
  }

/**
 * Create and start an embedded reverse proxy server.
 */
export async function createProxyServer(
  options: ProxyServerOptions,
): Promise<ProxyServerInstance> {
  const { host, logger } = options;
  let routes: ProxyRoute[] = [];

  const proxy = httpProxy.createProxyServer({
    xfwd: true,
  });

  proxy.on('error', (err, req, res) => {
    logger.warn(`Proxy error for ${req.url}: ${err.message}`);
    if (res && 'writeHead' in res && !res.headersSent) {
      (res as http.ServerResponse).writeHead(502, { 'Content-Type': 'application/json' });
      (res as http.ServerResponse).end(JSON.stringify({ error: 'Bad Gateway', message: err.message }));
    }
  });

  function matchRoute(pathname: string): ProxyRoute | undefined {
    // Routes are kept sorted longest-prefix-first
    for (const route of routes) {
      if (pathname === route.prefix || pathname.startsWith(route.prefix)) {
        return route;
      }
    }
    return undefined;
  }

  function sortRoutes(): void {
    routes.sort((a, b) => b.prefix.length - a.prefix.length);
  }

  function rewriteTarget(route: ProxyRoute, requestPath: string): string {
    const suffix = requestPath.slice(route.prefix.length);
    const upstreamPath = route.upstream.pathname;
    // Avoid double slashes when both upstream ends with / and suffix starts with /
    if (upstreamPath.endsWith('/') && suffix.startsWith('/')) {
      return upstreamPath + suffix.slice(1);
    }
    // Ensure a separator when upstream doesn't end with / and suffix doesn't start with /
    if (!upstreamPath.endsWith('/') && suffix.length > 0 && !suffix.startsWith('/')) {
      return upstreamPath + '/' + suffix;
    }
    return upstreamPath + suffix;
  }

  const server = http.createServer((req, res) => {
    const pathname = req.url ?? '/';

    // Built-in health endpoint
    if (pathname === '/_proxy/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, routes: routes.length }));
      return;
    }

    // Built-in debug endpoint
    if (pathname === '/_proxy/routes') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(routes.map(r => ({
            prefix: r.prefix,
            upstream: r.upstream.toString(),
            ws: r.ws,
            source: r.source,
      }))));
      return;
    }

    const route = matchRoute(pathname);
    if (!route) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
      return;
    }

    const targetPath = rewriteTarget(route, pathname);
    const target = `${route.upstream.protocol}//${route.upstream.host}`;

    const forwardedPrefix = computeForwardedPrefix(route);
    if (forwardedPrefix) {
      req.headers['x-forwarded-prefix'] = forwardedPrefix;
    } else {
      delete req.headers['x-forwarded-prefix'];
    }
    req.url = targetPath || '/';
    proxy.web(req, res, { target, changeOrigin: true });
  });

  // WebSocket upgrade handling
  server.on('upgrade', (req, socket, head) => {
    const pathname = req.url ?? '/';
    const route = matchRoute(pathname);

    if (!route || !route.ws) {
      socket.destroy();
      return;
    }

    const targetPath = rewriteTarget(route, pathname);
    const target = `${route.upstream.protocol}//${route.upstream.host}`;

    const forwardedPrefix = computeForwardedPrefix(route);
    if (forwardedPrefix) {
      req.headers['x-forwarded-prefix'] = forwardedPrefix;
    } else {
      delete req.headers['x-forwarded-prefix'];
    }
    req.url = targetPath || '/';
    proxy.ws(req, socket, head, { target, changeOrigin: true });
  });

  // Start listening
  const assignedPort = await new Promise<number>((resolve, reject) => {
    server.on('error', reject);
    server.listen(options.port, host, () => {
      const addr = server.address();
      const p = typeof addr === 'object' && addr ? addr.port : options.port;
      resolve(p);
    });
  });

  // publicUrl is assumed origin-only (scheme + host, no base path) and
  // governs only the advertised `url`, not the forwarded headers: `xfwd`
  // above relies on the fronting ingress to set X-Forwarded-Proto/Host.
  // Supporting a public base path (e.g. https://host/agent) would require
  // prepending it to X-Forwarded-Prefix and stripping it at the ingress —
  // not handled here.
  // `|| fallback` (not `??`) so an empty/whitespace-only publicUrl is treated
  // as unset rather than producing an empty `url`. The CLI also validates this
  // as a URL, but createProxyServer is callable directly so we guard here too.
  const url =
    options.publicUrl?.trim().replace(/\/+$/, '') ||
    `http://${host === '0.0.0.0' ? 'localhost' : host}:${assignedPort}`;

  const instance: ProxyServerInstance = {
    get port() { return assignedPort; },
    get host() { return host; },
    get url() { return url; },

    addRoute(route: ProxyRoute): void {
      // Equal-length prefixes keep insertion order after the stable sort, so
      // an existing identical prefix shadows the new route entirely.
      const existing = routes.find((r) => r.prefix === route.prefix);
      if (existing) {
        logger.warn(
          `Proxy route conflict: '${route.prefix}' already registered by ${existing.source}; ` +
            `route from ${route.source} will be shadowed`,
        );
      }
      routes.push(route);
      sortRoutes();
      logger.debug(`Proxy route added: ${route.prefix} → ${route.upstream.toString()} (${route.source})`);
    },

    removeRoutesBySource(source: string): void {
      const before = routes.length;
      routes = routes.filter(r => r.source !== source);
      const removed = before - routes.length;
      if (removed > 0) {
        logger.debug(`Proxy: removed ${removed} route(s) for source '${source}'`);
      }
    },

    getRoutes(): ReadonlyArray<Readonly<ProxyRoute>> {
      return routes;
    },

    async stop(): Promise<void> {
      proxy.close();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      logger.debug('Proxy server stopped');
    },
  };

  return instance;
}
