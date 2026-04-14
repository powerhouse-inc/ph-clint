/**
 * Powerhouse integration for ph-clint.
 *
 * Three independently-toggleable layers:
 * - Phase 1: Internal Reactor (in-process document store)
 * - Phase 2: Switchboard (GraphQL + MCP endpoint wrapping the Reactor)
 * - Phase 3: Connect (persistent web UI child process)
 *
 * All Powerhouse imports are lazy — the library works without them installed.
 */

import type { CommandContext, Integration, ServiceDefinition } from '../../core/types.js';
import type {
  PowerhouseContext,
  PowerhouseIntegrationOptions,
  SwitchboardInstance,
} from './types.js';
import { connectServiceDefinition } from './connect.js';

export type {
  PowerhouseContext,
  PowerhouseIntegrationOptions,
  DriveConfig,
  SubscriptionConfig,
  SwitchboardConfig,
  ConnectConfig,
  SwitchboardInstance,
} from './types.js';

/**
 * Result of definePowerhouseIntegration().
 * Returns the Integration object and optionally service definitions
 * (for Connect) that must be merged into CliOptions.services.
 */
export interface PowerhouseIntegrationResult {
  integration: Integration;
  /** Service definitions to merge into CliOptions.services (e.g. Connect). */
  services: ServiceDefinition[];
}

/**
 * Define a Powerhouse integration for a ph-clint CLI.
 *
 * Usage:
 * ```ts
 * const { integration, services } = definePowerhouseIntegration({
 *   documentModels: [myModel],
 *   drive: { name: 'My Agent' },
 *   subscriptions: { documentTypes: ['conversation'] },
 *   switchboard: { enabled: true, port: 4001 },
 *   connect: { enabled: true, port: 3000 },
 * });
 *
 * const cli = defineCli({
 *   integrations: [integration],
 *   services: [...services],
 * });
 * ```
 */
export function definePowerhouseIntegration(
  options: PowerhouseIntegrationOptions,
): PowerhouseIntegrationResult {
  let reactorModule: any | undefined;
  let unsubscribe: (() => void) | undefined;
  let switchboard: SwitchboardInstance | undefined;

  // Phase 3: Build service definitions at construction time
  // (before setup() — defineCli reads services at construction)
  const services: ServiceDefinition[] = [];
  if (options.connect?.enabled) {
    services.push(connectServiceDefinition(options.connect));
  }

  const integration: Integration = {
    id: 'powerhouse',

    async setup(context: CommandContext) {
      // Phase 1: Build Reactor with persistent storage
      const { buildReactor } = await import('./reactor.js');
      reactorModule = await buildReactor({
        documentModels: options.documentModels,
        storagePath: context.workspace.getStoreFolder('reactor-storage'),
      });

      // Phase 1: Create/find default drive
      const { ensureDrive } = await import('./drive.js');
      const driveId = await ensureDrive(reactorModule.client, options.drive);

      // Phase 1: Bridge subscriptions to event bus
      if (options.subscriptions && context.emit) {
        const { bridgeSubscriptions } = await import('./subscriptions.js');
        unsubscribe = bridgeSubscriptions(
          reactorModule.client,
          options.subscriptions,
          context.emit,
        );
      }

      // Phase 1: Expose on context
      const phContext: PowerhouseContext = {
        client: reactorModule.client,
        driveId,
      };
      context.powerhouse = phContext;

      // Phase 2: Optionally start Switchboard
      if (options.switchboard?.enabled) {
        const { startSwitchboard } = await import('./switchboard.js');
        switchboard = await startSwitchboard({
          reactorModule,
          port: options.switchboard.port ?? 4001,
          dbPath: context.workspace.getStoreFolder('read-model.db'),
          driveId,
        });
        phContext.switchboardUrl = switchboard.switchboardUrl;
        phContext.driveUrl = switchboard.driveUrl;
        phContext.mcpUrl = switchboard.mcpUrl;

        context.emit?.('powerhouse:switchboard:ready', {
          switchboardUrl: switchboard.switchboardUrl,
          driveUrl: switchboard.driveUrl,
          mcpUrl: switchboard.mcpUrl,
        });
      }

      // Phase 3: Auto-start Connect if enabled
      if (options.connect?.enabled && context.services && phContext.driveUrl) {
        const connectPort = options.connect.port ?? 3000;
        try {
          await context.services.start('connect', {
            params: { port: connectPort, driveUrl: phContext.driveUrl },
          });
        } catch {
          // Connect start failure is non-fatal — log but continue
          context.log?.warn('Failed to auto-start Connect service');
        }
      }

      // Signal readiness
      context.emit?.('powerhouse:ready', { driveId });
    },

    async teardown() {
      // Phase 3: Connect is managed by ServiceManager — no teardown needed here
      // (it persists beyond CLI exit by design)

      // Phase 2: Shutdown Switchboard first (reverse order)
      if (switchboard) {
        await switchboard.shutdown();
        switchboard = undefined;
      }

      // Phase 1: Unsubscribe and shutdown reactor
      unsubscribe?.();
      unsubscribe = undefined;

      if (reactorModule) {
        try {
          const status = reactorModule.reactor.kill();
          await status.completed;
        } catch {
          // Best-effort shutdown
        }
        reactorModule = undefined;
      }
    },
  };

  return { integration, services };
}
