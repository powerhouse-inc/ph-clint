/**
 * Types for the Powerhouse integration.
 *
 * These are intentionally loose (using `any` for Reactor types) because
 * @powerhousedao/reactor is an optional peer dependency — we can't import
 * its types at the module level.
 */

/**
 * Context added to CommandContext when the Powerhouse integration is active.
 * Commands access this as `context.powerhouse`.
 */
export interface PowerhouseContext {
  /** The Reactor client — full CRUD + subscription API (IReactorClient). */
  client: any;
  /** The default drive ID (created or found on startup). */
  driveId: string;
  /** Phase 2: Switchboard GraphQL URL (e.g. http://localhost:4001/graphql). */
  switchboardUrl?: string;
  /** Phase 2: Switchboard drive URL (e.g. http://localhost:4001/d/{driveId}). */
  driveUrl?: string;
  /** Phase 2: Switchboard MCP URL (e.g. http://localhost:4001/mcp). */
  mcpUrl?: string;
  /** Phase 3: Connect web UI URL (e.g. http://localhost:3000). */
  connectUrl?: string;
}

/**
 * Drive configuration for the Powerhouse integration.
 */
export interface DriveConfig {
  /** Drive display name. */
  name: string;
  /** Optional icon URL for the drive. */
  icon?: string;
}

/**
 * Subscription configuration — filters which document changes
 * are bridged to the event bus.
 */
export interface SubscriptionConfig {
  /** Filter by document type(s). */
  documentTypes?: string[];
}

/**
 * Switchboard (Phase 2) configuration.
 */
export interface SwitchboardConfig {
  /** Enable Switchboard. Default: false. */
  enabled: boolean;
  /** HTTP port. Default: 4801. */
  port?: number;
  /** Run preflight port check before starting. Default: true. */
  preflight?: boolean;
}

/**
 * Connect UI (Phase 3) configuration.
 */
export interface ConnectConfig {
  /** Enable Connect. Default: false. */
  enabled: boolean;
  /** HTTP port. Default: 3000. */
  port?: number;
}

/**
 * Options for definePowerhouseIntegration().
 */
export interface PowerhouseIntegrationOptions {
  /** Document model modules to register with the Reactor. */
  documentModels: any[];
  /** Default drive to create/find on startup. */
  drive?: DriveConfig;
  /** Subscribe to document changes → event bus. */
  subscriptions?: SubscriptionConfig;
  /** Phase 2: Switchboard (GraphQL + MCP endpoint). Requires Phase 1. */
  switchboard?: SwitchboardConfig;
  /** Phase 3: Connect web UI. Requires Phase 2. */
  connect?: ConnectConfig;
}

/**
 * Internal handle for the Switchboard instance.
 */
export interface SwitchboardInstance {
  switchboardUrl: string;
  driveUrl: string;
  mcpUrl: string;
  shutdown(): Promise<void>;
}
