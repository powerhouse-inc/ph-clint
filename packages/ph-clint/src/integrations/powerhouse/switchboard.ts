/**
 * Switchboard — wraps the Phase 1 Reactor via initializeAndStartAPI,
 * exposing GraphQL + MCP endpoints.
 */

import type { ReactorClientModule, SwitchboardInstance } from './types.js';

export interface StartSwitchboardOptions {
  /** The ReactorClientModule from Phase 1. */
  reactorModule: ReactorClientModule;
  /** Hostname/IP to bind to. Default: 'localhost'. */
  host?: string;
  /** HTTP port for Switchboard. */
  port: number;
  /** Path for the Switchboard read model database. */
  dbPath: string;
  /** Default drive ID (for constructing the drive URL). */
  driveId: string;
}

/**
 * Dynamically import a module, wrapping the import() to prevent
 * TypeScript from resolving peer dependency types at compile time.
 */
async function lazyImport<T = Record<string, unknown>>(
  specifier: string,
): Promise<T> {
  return import(/* webpackIgnore: true */ specifier) as Promise<T>;
}

interface SwitchboardApi {
  stop?: () => Promise<void>;
  httpAdapter?: { httpServer?: { close(cb: () => void): void }; close?(cb: () => void): void };
}

/**
 * Start Switchboard wrapping the Phase 1 Reactor.
 *
 * Lazy-loads @powerhousedao/reactor-api — it's an optional peer dependency.
 * Returns the pre-built ReactorClientModule directly to avoid creating
 * a second Reactor instance.
 */
export async function startSwitchboard(
  options: StartSwitchboardOptions,
): Promise<SwitchboardInstance> {
  const reactorApi = await lazyImport<{
    initializeAndStartAPI: (
      factory: (documentModels: unknown) => unknown,
      opts: Record<string, unknown>,
      mode: string,
    ) => Promise<SwitchboardApi>;
  }>('@powerhousedao/reactor-api');
  const { initializeAndStartAPI } = reactorApi;

  const api = await initializeAndStartAPI(
    async (_documentModels: unknown) => options.reactorModule,
    {
      port: options.port,
      dbPath: options.dbPath,
      mcp: true,
      packages: [],
    },
    'agent',
  );

  const host = options.host ?? 'localhost';
  const switchboardUrl = `http://${host}:${options.port}/graphql`;
  const driveUrl = `http://${host}:${options.port}/d/${options.driveId}`;
  const mcpUrl = `http://${host}:${options.port}/mcp`;

  return {
    switchboardUrl,
    driveUrl,
    mcpUrl,
    async shutdown() {
      try {
        if (api && typeof api.stop === 'function') {
          await api.stop();
        } else if (api?.httpAdapter) {
          const server = api.httpAdapter.httpServer ?? api.httpAdapter;
          if (server) {
            const closeFn = 'close' in server ? server.close : undefined;
            if (typeof closeFn === 'function') {
              await new Promise<void>((resolve) => closeFn(() => resolve()));
            }
          }
        }
      } catch {
        // Best-effort shutdown
      }
    },
  };
}
