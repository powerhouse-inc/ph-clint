/**
 * Types for the Powerhouse integration.
 *
 * All Powerhouse types are imported via `import type` — erased at runtime,
 * no peer-dep coupling at the module level. @powerhousedao/reactor is still
 * an optional peer for runtime, but types flow freely.
 */

import type {
  IReactorClient,
  DocumentChangeEvent,
  SearchFilter,
  ViewFilter,
  PagingOptions,
  PagedResults,
  JobInfo,
} from '@powerhousedao/reactor';

/**
 * Options for creating an empty document. Mirrors the internal
 * `CreateDocumentOptions` type in @powerhousedao/reactor (not exported there).
 */
interface CreateDocumentOptions {
  parentIdentifier?: string;
  documentModelVersion?: number;
}
import type {
  DocumentModelModule,
  PHDocument,
  Action,
  PHBaseState,
} from 'document-model';
import type { WorkdirStore } from '../../core/types.js';

// ── Registry ──────────────────────────────────────────────────────

/**
 * One entry in a DocumentRegistry. Carries enough to narrow every
 * IReactorClient method that touches a PHDocument or Action.
 *
 * - `document` — the concrete PHDocument shape returned by `get`, `create`, etc.
 * - `actions` — union of Action types accepted by `execute` / `executeAsync`.
 * - `state` — the global state shape, used by `DocumentModelModule<S>` introspection.
 */
export interface RegistryEntry<
  S extends PHBaseState = PHBaseState,
  A extends Action = Action,
> {
  document: PHDocument<S>;
  actions: A;
  state: S;
}

/**
 * Maps a documentType string → RegistryEntry. Impls build one with
 * `defineRegistry([Module1, Module2] as const)`; see registry.ts.
 */
export type DocumentRegistry = Record<string, RegistryEntry>;

/**
 * Fallback registry used when a CLI doesn't declare one.
 * Every slot resolves to the base PHDocument / Action shapes.
 * `R = AnyRegistry` is the default for ReactorContext, CoreContext, etc.
 */
export type AnyRegistry = Record<string, RegistryEntry>;

// ── Typed client ──────────────────────────────────────────────────

/**
 * Typed view over IReactorClient. Every method that takes a documentType
 * string, returns a PHDocument, or accepts an Action is re-declared with
 * registry-derived types. All other methods are inherited via `Omit<…>`.
 *
 * Runtime: the underlying object IS an IReactorClient — we only cast at the
 * ReactorContext boundary. No runtime wrapping, no perf cost.
 */
export interface TypedReactorClient<R extends DocumentRegistry>
  extends Omit<
    IReactorClient,
    | 'get'
    | 'getChildren'
    | 'getParents'
    | 'find'
    | 'getDocumentModelModule'
    | 'create'
    | 'createEmpty'
    | 'createDocumentInDrive'
    | 'execute'
    | 'executeAsync'
    | 'rename'
    | 'addChildren'
    | 'removeChildren'
    | 'moveChildren'
    | 'subscribe'
  > {
  get<T extends keyof R & string = keyof R & string>(
    identifier: string,
    view?: ViewFilter,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  getChildren<T extends keyof R & string = keyof R & string>(
    parentIdentifier: string,
    view?: ViewFilter,
    paging?: PagingOptions,
    signal?: AbortSignal,
  ): Promise<PagedResults<R[T]['document']>>;

  getParents<T extends keyof R & string = keyof R & string>(
    childIdentifier: string,
    view?: ViewFilter,
    paging?: PagingOptions,
    signal?: AbortSignal,
  ): Promise<PagedResults<R[T]['document']>>;

  find<T extends keyof R & string = keyof R & string>(
    search: Omit<SearchFilter, 'documentTypes'> & { documentTypes?: T[] },
    view?: ViewFilter,
    paging?: PagingOptions,
    signal?: AbortSignal,
  ): Promise<PagedResults<R[T]['document']>>;

  getDocumentModelModule<T extends keyof R & string>(
    documentType: T,
  ): Promise<DocumentModelModule<R[T]['state']>>;

  create<T extends keyof R & string = keyof R & string>(
    document: R[T]['document'],
    parentIdentifier?: string,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  createEmpty<T extends keyof R & string>(
    documentModelType: T,
    options?: CreateDocumentOptions,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  createDocumentInDrive<T extends keyof R & string = keyof R & string>(
    driveId: string,
    document: R[T]['document'],
    parentFolder?: string,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  execute<T extends keyof R & string = keyof R & string>(
    documentIdentifier: string,
    branch: string,
    actions: Array<R[T]['actions']>,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  executeAsync<T extends keyof R & string = keyof R & string>(
    documentIdentifier: string,
    branch: string,
    actions: Array<R[T]['actions']>,
    signal?: AbortSignal,
  ): Promise<JobInfo>;

  rename<T extends keyof R & string = keyof R & string>(
    documentIdentifier: string,
    name: string,
    branch?: string,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  addChildren<T extends keyof R & string = keyof R & string>(
    parentIdentifier: string,
    documentIdentifiers: string[],
    branch?: string,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  removeChildren<T extends keyof R & string = keyof R & string>(
    parentIdentifier: string,
    documentIdentifiers: string[],
    branch?: string,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  moveChildren<T extends keyof R & string = keyof R & string>(
    sourceParentIdentifier: string,
    targetParentIdentifier: string,
    documentIdentifiers: string[],
    branch?: string,
    signal?: AbortSignal,
  ): Promise<{ source: R[T]['document']; target: R[T]['document'] }>;

  subscribe<T extends keyof R & string = keyof R & string>(
    search: Omit<SearchFilter, 'documentTypes'> & { documentTypes?: T[] },
    callback: (event: TypedDocumentChangeEvent<R, T>) => void,
    view?: ViewFilter,
  ): () => void;
}

/** Narrowed DocumentChangeEvent carrying registry-typed documents. */
export interface TypedDocumentChangeEvent<
  R extends DocumentRegistry,
  T extends keyof R & string = keyof R & string,
> extends Omit<DocumentChangeEvent, 'documents'> {
  documents: Array<R[T]['document']>;
}

// ── Reactor client module ────────────────────────────────────────

/**
 * Structural type for the ReactorClientModule returned by
 * @powerhousedao/reactor's ReactorClientBuilder.buildModule().
 *
 * Used as the boundary type between buildReactor() and its consumers
 * (ensureDrive, startSwitchboard, buildDefaultReactor). The actual module
 * has additional properties; this captures the subset ph-clint uses.
 *
 * Imported via `import type` — zero runtime coupling.
 */
export interface ReactorClientModule {
  client: IReactorClient;
  reactor: {
    kill(): { completed: Promise<void> };
    findByType(
      documentType: string,
    ): Promise<{ results?: Array<{ header: { id: string } }> } | undefined>;
  };
}

// ── Drive entry ──────────────────────────────────────────────────

/**
 * A drive managed by the reactor. Each drive has a role:
 * - `personal` — the agent's own workspace drive
 * - `watched` — an observed drive (local or remote)
 */
export interface DriveEntry {
  /** Drive document ID. */
  id: string;
  /** Display name. */
  name: string;
  /** Role: 'personal' = agent's own workspace, 'watched' = observed from elsewhere. */
  role: 'personal' | 'watched';
  /** For watched remote drives: the Switchboard URL to sync from. */
  remoteUrl?: string;
}

// ── Reactor context ───────────────────────────────────────────────

/**
 * Context for the Powerhouse reactor capability.
 * Returned by the reactor factory and accessible via `context.reactor()`.
 */
export interface ReactorContext<R extends DocumentRegistry = AnyRegistry> {
  /** The Reactor client — typed CRUD + subscription API. */
  client: TypedReactorClient<R>;
  /** The default drive ID. Aliases personalDriveId when multi-drive is configured. */
  driveId: string;
  /** All managed drives, ordered as configured. */
  drives?: DriveEntry[];
  /** The personal drive ID (first drive with role 'personal'). */
  personalDriveId?: string;
  /** Phase 2: Switchboard GraphQL URL (e.g. http://localhost:4001/graphql). */
  switchboardUrl?: string;
  /** Phase 2: Switchboard drive URL (e.g. http://localhost:4001/d/{driveId}). */
  driveUrl?: string;
  /** Phase 2: Switchboard MCP URL (e.g. http://localhost:4001/mcp). */
  mcpUrl?: string;
  /** Phase 3: Connect web UI URL (e.g. http://localhost:3000). */
  connectUrl?: string;
  /** Internal: the ReactorClientModule, passed to startSwitchboard(). */
  _module?: ReactorClientModule;
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
export interface SubscriptionConfig<R extends DocumentRegistry = AnyRegistry> {
  /** Filter by document type(s). */
  documentTypes?: Array<keyof R & string>;
}

/**
 * Switchboard (Phase 2) configuration.
 */
export interface SwitchboardConfig {
  /** Enable Switchboard. Default: false. */
  enabled: boolean;
  /** Hostname/IP to bind to. Default: 'localhost'. */
  host?: string;
  /** HTTP port. Default: derived from CLI name via hash. */
  port?: number;
  /** Number of ports to scan starting from `port`. Default: 1. */
  portRange?: number;
  /** Service label for preflight messages. Default: '{cliName}-api'. */
  name?: string;
}

/**
 * Connect UI (Phase 3) configuration.
 */
export interface ConnectConfig {
  /** Enable Connect. Default: false. */
  enabled: boolean;
  /** HTTP port. Default: derived from CLI name via hash. */
  port?: number;
  /** Number of ports to scan starting from `port`. Default: 1. */
  portRange?: number;
  /** Working directory for `ph connect` (must be a Reactor Package project). */
  workdir?: string;
  /** Service ID for ServiceManager. Default: '{cliName}-studio'. */
  name?: string;
  /** Path to pre-built Connect static assets. When set, serves via static file server instead of Vite dev server. */
  assetsDir?: string;
}

/**
 * Options for definePowerhouseIntegration().
 */
export interface PowerhouseIntegrationOptions<
  R extends DocumentRegistry = AnyRegistry,
> {
  /** Document model modules to register with the Reactor. */
  documentModels: DocumentModelModule[];
  /** Document registry for typed client narrowing. Usually built with `defineRegistry([...modules] as const)`. */
  registry?: R;
  /** Default drive to create/find on startup. */
  drive?: DriveConfig;
  /** Subscribe to document changes → event bus. */
  subscriptions?: SubscriptionConfig<R>;
  /** Phase 2: Switchboard (GraphQL + MCP endpoint). Requires Phase 1. */
  switchboard?: SwitchboardConfig;
  /** Phase 3: Connect web UI. Requires Phase 2. */
  connect?: ConnectConfig;
}

/**
 * Context passed to the reactor factory in configureReactor().
 * Provides core infrastructure the factory needs to build the reactor.
 */
export interface ReactorSetupContext<
  R extends DocumentRegistry = AnyRegistry,
> {
  workdir: string;
  config: Record<string, unknown>;
  workspace: WorkdirStore;
  emit?: import('../../core/types.js').EmitFn<R>;
  on?: import('../../core/types.js').OnFn<R>;
  /** Switchboard config — passed by the framework so create() can set enableSync. */
  switchboard?: SwitchboardConfig;
}

/**
 * Configuration for configureReactor().
 * The `create` factory is called lazily on first reactor() access.
 */
export interface ReactorConfiguration<
  R extends DocumentRegistry = AnyRegistry,
> {
  /** Factory that builds and returns a ReactorContext. */
  create: (ctx: ReactorSetupContext<R>) => Promise<ReactorContext<R>>;
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
