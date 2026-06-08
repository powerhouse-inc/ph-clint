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
   *
   * A non-root pathname mounts the whole proxy surface under that base
   * path (e.g. `https://host/myagent` → base path `/myagent`): incoming
   * requests carry the prefix, it is stripped before route matching, and
   * redirect Locations are re-prefixed with it.
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
   * Derive the mount base path from publicUrl's pathname. Returns '' for an
   * absent/invalid/root pathname, otherwise a leading-slash, no-trailing-slash
   * form ('/myagent'). Mirrors the trailing-slash stripping the advertised
   * `url` applies, so the base path and `url` stay aligned.
   */
  function deriveBasePath(publicUrl: string | undefined): string {
    const trimmed = publicUrl?.trim();
    if (!trimmed) return '';
    let pathname: string;
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      return '';
    }
    const normalized = pathname.replace(/\/+$/, '');
    return normalized === '' ? '' : normalized;
  }

  /**
   * Compute the X-Forwarded-Prefix value to send upstream. `base` is the
   * mount base path ('' | '/x') prepended so upstreams emitting absolute
   * paths reconstruct the externally-visible prefix.
   */
  function computeForwardedPrefix(route: ProxyRoute, base: string): string | undefined {
    if (!route.upstream) return undefined;
    const strip = (s: string) => s.replace(/\/$/, '');
    const prefix = strip(route.prefix);
    const upstreamPath = strip(route.upstream.pathname);
    const routePrefix = upstreamPath && prefix.endsWith(upstreamPath) ? prefix.slice(0, -upstreamPath.length) : prefix;
    const result = base + routePrefix;
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

  // Base path the whole proxy surface is mounted under, derived from a
  // non-root pathname on publicUrl. Empty when serving from the origin
  // root. Normalized to a leading-slash, no-trailing-slash form ('' | '/x').
  const basePath = deriveBasePath(options.publicUrl);

  // Strip the base path from an incoming request path before route
  // matching. Requests that don't carry the prefix yield undefined so the
  // caller can 404 rather than mismatch a root route.
  function stripBase(pathname: string): string | undefined {
    if (!basePath) return pathname;
    if (pathname === basePath) return '/';
    if (pathname.startsWith(basePath + '/')) return pathname.slice(basePath.length);
    return undefined;
  }

  // Re-prefix a root-relative redirect Location with the base path so the
  // browser stays under the mount. Absolute URLs and other-prefixed paths
  // pass through untouched.
  function prefixRedirect(location: string): string {
    if (!basePath) return location;
    if (!location.startsWith('/') || location.startsWith('//')) return location;
    if (location === basePath || location.startsWith(basePath + '/')) return location;
    return basePath + location;
  }

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
    // Exact routes win first, so a `'/'` exact redirect fires only on the bare
    // root while `/assets/*`, `/d/<id>`, etc. fall through to prefix routes
    // (including a `'/'` catch-all).
    for (const route of routes) {
      if (route.exact && pathname === route.prefix) {
        return route;
      }
    }
    // Routes are kept sorted longest-prefix-first.
    for (const route of routes) {
      if (route.exact) continue;
      if (pathname === route.prefix || pathname.startsWith(route.prefix)) {
        return route;
      }
    }
    return undefined;
  }

  function sortRoutes(): void {
    routes.sort((a, b) => b.prefix.length - a.prefix.length);
  }

  function rewriteTarget(route: ProxyRoute, upstream: URL, requestPath: string): string {
    const suffix = requestPath.slice(route.prefix.length);
    const upstreamPath = upstream.pathname;
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
    const rawPath = req.url ?? '/';
    const stripped = stripBase(rawPath);
    if (stripped === undefined) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found', path: rawPath }));
      return;
    }
    const pathname = stripped;

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
            upstream: r.upstream?.toString(),
            ws: r.ws,
            source: r.source,
            ...(r.redirectTo ? { redirectTo: r.redirectTo } : {}),
            ...(r.exact ? { exact: true } : {}),
      }))));
      return;
    }

    const route = matchRoute(pathname);
    if (!route) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
      return;
    }

    if (route.redirectTo) {
      res.writeHead(302, { Location: prefixRedirect(route.redirectTo) });
      res.end();
      return;
    }

    if (!route.upstream) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway', message: 'route has no upstream' }));
      return;
    }

    const upstream = route.upstream;
    const targetPath = rewriteTarget(route, upstream, pathname);
    const target = `${upstream.protocol}//${upstream.host}`;

    const forwardedPrefix = computeForwardedPrefix(route, basePath);
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
    const stripped = stripBase(req.url ?? '/');
    if (stripped === undefined) {
      socket.destroy();
      return;
    }
    const pathname = stripped;
    const route = matchRoute(pathname);

    if (!route || !route.ws || !route.upstream) {
      socket.destroy();
      return;
    }

    const upstream = route.upstream;
    const targetPath = rewriteTarget(route, upstream, pathname);
    const target = `${upstream.protocol}//${upstream.host}`;

    const forwardedPrefix = computeForwardedPrefix(route, basePath);
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

  // `url` advertises the browser-facing base, including any base path on
  // publicUrl. `xfwd` relies on the fronting ingress to set
  // X-Forwarded-Proto/Host; the base path is folded into X-Forwarded-Prefix
  // here so upstreams emitting absolute paths reconstruct the full prefix.
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
      // Same prefix only conflicts when both match the same way: an exact
      // route and a prefix route on the same prefix (e.g. a `'/'` redirect vs
      // Connect's `'/'` catch-all) coexist — matchRoute dispatches exact first.
      const existing = routes.find(
        (r) => r.prefix === route.prefix && !!r.exact === !!route.exact,
      );
      if (existing) {
        logger.warn(
          `Proxy route conflict: '${route.prefix}'${route.exact ? ' (exact)' : ''} already registered by ${existing.source}; ` +
            `route from ${route.source} will be shadowed`,
        );
      }
      routes.push(route);
      sortRoutes();
      const dest = route.redirectTo
        ? `redirect → ${route.redirectTo}`
        : route.upstream?.toString() ?? '(no upstream)';
      logger.debug(`Proxy route added: ${route.prefix} → ${dest} (${route.source})`);
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
