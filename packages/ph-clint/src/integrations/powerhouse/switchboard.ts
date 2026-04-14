/**
 * Switchboard — wraps the Phase 1 Reactor via initializeAndStartAPI,
 * exposing GraphQL + MCP endpoints.
 */

import type { SwitchboardInstance } from './types.js';

export interface StartSwitchboardOptions {
  /** The ReactorClientModule from Phase 1. */
  reactorModule: any;
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
async function lazyImport(specifier: string): Promise<any> {
  return import(/* webpackIgnore: true */ specifier);
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
  const reactorApi = await lazyImport('@powerhousedao/reactor-api');
  const { initializeAndStartAPI } = reactorApi;

  const api = await initializeAndStartAPI(
    async (_documentModels: any) => options.reactorModule,
    {
      port: options.port,
      dbPath: options.dbPath,
      mcp: true,
      packages: [],
    },
    'agent',
  );

  const switchboardUrl = `http://localhost:${options.port}/graphql`;
  const driveUrl = `http://localhost:${options.port}/d/${options.driveId}`;
  const mcpUrl = `http://localhost:${options.port}/mcp`;

  return {
    switchboardUrl,
    driveUrl,
    mcpUrl,
    async shutdown() {
      try {
        if (api && typeof api.stop === 'function') {
          await api.stop();
        } else if (api && api.httpAdapter) {
          const server = api.httpAdapter?.httpServer ?? api.httpAdapter;
          if (typeof server.close === 'function') {
            await new Promise<void>((resolve) => server.close(() => resolve()));
          }
        }
      } catch {
        // Best-effort shutdown
      }
    },
  };
}
