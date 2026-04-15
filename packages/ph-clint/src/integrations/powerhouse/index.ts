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
} from './types.js';

export { connectServiceDefinition } from './connect.js';
export { bridgeSubscriptions } from './subscriptions.js';
export { ensureDrive } from './drive.js';
export { buildReactor } from './reactor.js';
