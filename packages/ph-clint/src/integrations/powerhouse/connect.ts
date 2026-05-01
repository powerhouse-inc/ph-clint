/**
 * Connect UI — generates a ServiceDefinition for Connect as a persistent child process.
 *
 * Two modes:
 * - **Static mode** (assetsDir set): serves pre-built SPA via connect-server.js
 * - **Studio mode** (no assetsDir): runs Vite dev server via `ph connect`
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { ServiceDefinition } from '../../core/types.js';
import type { ConnectConfig } from './types.js';
import { checkCommand, checkPort } from '../../core/preflight.js';

/**
 * Resolve the path to the compiled connect-server.js script.
 * Works from both source (src/) and compiled (dist/) contexts.
 */
function resolveConnectServerScript(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return join(thisDir, 'connect-server.js');
}

/**
 * Create a ServiceDefinition for Connect.
 *
 * Connect runs as a managed child process via ServiceManager, persisting
 * beyond CLI exit. It serves the Powerhouse Connect web UI pointing at
 * the Switchboard's drive URL.
 */
export function connectServiceDefinition(
  connectConfig: ConnectConfig,
): ServiceDefinition {
  const serviceName = connectConfig.name ?? 'connect';
  const servicePort = connectConfig.port!; // Always stamped by resolveReactorDefaults
  const isStaticMode = !!connectConfig.assetsDir;

  return {
    id: serviceName,
    name: serviceName,
    description: 'Powerhouse Connect web interface',
    command: (params?: Record<string, unknown>) => {
      const p = (params?.port as number) ?? servicePort;

      if (isStaticMode) {
        const serverScript = resolveConnectServerScript();
        return `node ${serverScript} --dir ${connectConfig.assetsDir} --port ${p}`;
      }

      return `ph connect --port ${p}`;
    },
    env: (_config: Record<string, unknown>, params?: Record<string, unknown>) => ({
      PH_CONNECT_DEFAULT_DRIVES_URL: (params?.driveUrl as string) ?? '',
      PH_CONNECT_DRIVES_PRESERVE_STRATEGY: 'preserve-all',
    }),
    preflight: [
      // ph CLI is only needed for studio mode (Vite dev server)
      ...(isStaticMode
        ? []
        : [
            checkCommand('ph', {
              hint: 'Install the Powerhouse CLI: npm install -g ph-cli',
            }),
          ]),
      checkPort((ctx) => (ctx.params?.port as number) ?? servicePort, serviceName),
    ],
    readiness: {
      patterns: [
        {
          name: 'connect',
          pattern: /Local:\s*(https?:\/\/[^\s]+)/,
          captures: { 'connect-studio': { group: 1, type: 'website' as const } },
        },
      ],
      timeout: 30_000,
    },
    shutdown: { signal: 'SIGTERM', timeout: 5_000 },
    restart: { enabled: false, maxRetries: 0, delay: 0 },
  };
}
