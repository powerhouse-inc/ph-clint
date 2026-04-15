/**
 * Types for the Powerhouse integration.
 *
 * These are intentionally loose (using `any` for Reactor types) because
 * @powerhousedao/reactor is an optional peer dependency — we can't import
 * its types at the module level.
 */

/**
 * Context for the Powerhouse reactor capability.
 * Returned by the reactor factory and accessible via `context.reactor()`.
 */
export interface ReactorContext {
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
  /** Internal: the ReactorClientModule, passed to startSwitchboard(). */
  _module?: any;
  /** Teardown — called by the framework on CLI exit. */
  shutdown(): Promise<void>;
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
  /** Hostname/IP to bind to. Default: 'localhost'. */
  host?: string;
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
  /** Working directory for `ph connect` (must be a Reactor Package project). */
  workdir?: string;
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
 * Context passed to the reactor factory in configureReactor().
 * Provides core infrastructure the factory needs to build the reactor.
 */
export interface ReactorSetupContext {
  workdir: string;
  config: Record<string, unknown>;
  workspace: import('../../core/types.js').WorkdirStore;
  emit?: (event: string, data?: unknown) => void;
  on?: (event: string, handler: (data?: unknown) => void) => void;
  /** Switchboard config — passed by the framework so create() can set enableSync. */
  switchboard?: SwitchboardConfig;
}

/**
 * Configuration for configureReactor().
 * The `create` factory is called lazily on first reactor() access.
 */
export interface ReactorConfiguration {
  /** Factory that builds and returns a ReactorContext. */
  create: (ctx: ReactorSetupContext) => Promise<ReactorContext>;
  /** Connect web UI service configuration — commands injected immediately. */
  connect?: ConnectConfig;
  /** Switchboard service configuration. */
  switchboard?: SwitchboardConfig;
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
