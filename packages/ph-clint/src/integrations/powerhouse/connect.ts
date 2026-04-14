/**
 * Connect UI — generates a ServiceDefinition for Connect as a persistent child process.
 */

import type { ServiceDefinition } from '../../core/types.js';
import type { ConnectConfig } from './types.js';
import { checkCommand, checkPort } from '../../core/preflight.js';

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
  const defaultPort = connectConfig.port ?? 3000;

  return {
    id: 'connect',
    name: 'Connect Studio',
    description: 'Powerhouse Connect web interface',
    command: (params?: Record<string, unknown>) => {
      const p = (params?.port as number) ?? defaultPort;
      const driveUrl = (params?.driveUrl as string) ?? '';
      return `ph connect --port ${p} --default-drives-url ${driveUrl}`;
    },
    env: (_config: any, params?: Record<string, unknown>) => ({
      PH_CONNECT_DEFAULT_DRIVES_URL: (params?.driveUrl as string) ?? '',
      PH_CONNECT_DRIVES_PRESERVE_STRATEGY: 'preserve-all',
    }),
    preflight: [
      checkCommand('ph', {
        hint: 'Install the Powerhouse CLI: npm install -g ph-cli',
      }),
      checkPort((ctx) => (ctx.params?.port as number) ?? defaultPort, 'Connect Studio'),
    ],
    readiness: {
      patterns: [
        {
          name: 'connect',
          pattern: /Local:\s*(http:\/\/localhost:\d+)/,
          captures: { 'connect-studio': { group: 1, type: 'website' as const } },
        },
      ],
      timeout: 30_000,
    },
    shutdown: { signal: 'SIGTERM', timeout: 5_000 },
    restart: { enabled: false, maxRetries: 0, delay: 0 },
  };
}
