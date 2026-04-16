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

export type {
  ReactorContext,
  ReactorSetupContext,
  ReactorConfiguration,
  PowerhouseIntegrationOptions,
  DriveConfig,
  SubscriptionConfig,
  SwitchboardConfig,
  ConnectConfig,
  SwitchboardInstance,
  DocumentRegistry,
  AnyRegistry,
  RegistryEntry,
  TypedReactorClient,
  TypedDocumentChangeEvent,
} from './types.js';

export type { InferRegistry, ActionOf } from './registry.js';
export { defineRegistry } from './registry.js';

export { connectServiceDefinition } from './connect.js';
export { bridgeSubscriptions } from './subscriptions.js';
export { ensureDrive } from './drive.js';
export { buildReactor } from './reactor.js';
export { startSwitchboard } from './switchboard.js';
export type { StartSwitchboardOptions } from './switchboard.js';

import type { DocumentModelModule } from 'document-model';
import type {
  ReactorContext,
  ReactorSetupContext,
  DriveConfig,
  SubscriptionConfig,
  DocumentRegistry,
  AnyRegistry,
  TypedReactorClient,
} from './types.js';

/**
 * Options for buildDefaultReactor().
 */
export interface BuildDefaultReactorOptions<
  R extends DocumentRegistry = AnyRegistry,
> {
  /** Document model modules to register with the Reactor. */
  documentModels: DocumentModelModule[];
  /** Default drive to create/find on startup. */
  drive?: DriveConfig;
  /** Subscribe to document changes → event bus. */
  subscriptions?: SubscriptionConfig<R>;
}

/**
 * Build a ReactorContext using the standard composition:
 * buildReactor() + ensureDrive() + bridgeSubscriptions() + startSwitchboard().
 *
 * This is the common-case helper for configureReactor().create.
 * Advanced users can write their own factory.
 */
export async function buildDefaultReactor<
  R extends DocumentRegistry = AnyRegistry,
>(
  ctx: ReactorSetupContext<R>,
  options: BuildDefaultReactorOptions<R>,
): Promise<ReactorContext<R>> {
  const { buildReactor } = await import('./reactor.js');
  const { ensureDrive } = await import('./drive.js');

  const reactorModule = await buildReactor({
    documentModels: options.documentModels,
    storagePath: ctx.workspace.getStoreFolder('reactor-storage'),
    enableSync: !!ctx.switchboard?.enabled,
  });

  const driveId = await ensureDrive(reactorModule, options.drive);

  let unsubscribe: (() => void) | undefined;
  if (options.subscriptions && ctx.emit) {
    const { bridgeSubscriptions } = await import('./subscriptions.js');
    unsubscribe = bridgeSubscriptions<R>(
      reactorModule.client,
      options.subscriptions,
      ctx.emit,
    );
  }

  const result: ReactorContext<R> = {
    client: reactorModule.client as TypedReactorClient<R>,
    driveId,
    _module: reactorModule,
    async shutdown() {
      unsubscribe?.();
      try {
        const status = reactorModule.reactor.kill();
        await status.completed;
      } catch {
        // Best-effort shutdown
      }
    },
  };

  ctx.emit?.('powerhouse:ready', { driveId });

  return result;
}
