/**
 * `createDocumentChangeTrigger` — typed helper that collapses the common
 * "subscribe to document changes, coalesce, load doc, narrow, call onChange"
 * pattern into a single definition.
 *
 * The helper owns subscription setup, per-event filtering by documentType
 * (and optional literal documentId), the pending counter, initial
 * reconcile, document loading, and registry-driven type narrowing. Impl
 * code only writes the `onChange` handler (plus an optional `filter` and
 * an optional `documentId` resolver for impl-specific lookup).
 */
import type {
  DocumentRegistry,
  AnyRegistry,
} from './types.js';
import type {
  Trigger,
  TriggerContext,
  WorkItem,
} from '../../core/types.js';

export interface DocumentChangeTriggerOptions<
  R extends DocumentRegistry,
  T extends keyof R & string,
  TConfig = Record<string, unknown>,
  TState extends { pending: number } = { pending: number },
> {
  /** Unique trigger id for logging/routing. */
  id: string;

  /** The document type to watch. Must be a key in the registry. */
  documentType: T;

  /**
   * The specific document id (or a function that resolves one from context).
   * When omitted, the helper watches ALL documents of `documentType` on the
   * default drive — all change events bump pending, and `onChange` is called
   * once per poll cycle with the resolved doc (only makes sense when the
   * consumer knows how to find the right doc in `onChange`).
   *
   * When a function is provided, it's resolved lazily on each poll. Returning
   * `undefined` skips the tick.
   */
  documentId?:
    | string
    | ((ctx: TriggerContext<TState, TConfig, R>) => Promise<string | undefined>);

  /**
   * Fire once on startup before any event arrives — useful for reconciling
   * against the current document state. Default: true.
   */
  initialReconcile?: boolean;

  /**
   * Optional predicate: called after loading the document, before onChange.
   * Return false to skip this tick (no work item produced). Useful for
   * de-duping when the impl needs access to the full loaded document.
   */
  filter?: (
    doc: R[T]['document'],
    ctx: TriggerContext<TState, TConfig, R>,
  ) => boolean | Promise<boolean>;

  /**
   * User's change handler. Receives the loaded, type-narrowed document and
   * the full trigger context. Returns a work item for the routine loop to
   * execute (or null to skip).
   */
  onChange: (
    doc: R[T]['document'],
    ctx: TriggerContext<TState, TConfig, R>,
  ) => Promise<WorkItem | null>;

  /**
   * Optional initial state for the trigger's private slot. Defaults to
   * `{ pending: 0 }`. When supplied, the shape MUST include a `pending:
   * number` field — the helper bumps and drains it internally.
   */
  state?: () => TState;
}

/**
 * Build a Trigger that listens for document change events on the event bus,
 * coalesces them, loads the target document, narrows to the registered type,
 * and hands it to the user's onChange handler.
 *
 * Runtime behavior:
 *  1. `setup()` subscribes to `powerhouse:document:changed`. For each event,
 *     if the documentType matches (and, when `documentId` is a literal
 *     string, the id also matches), bump the pending counter.
 *  2. If `initialReconcile !== false`, `setup()` bumps pending once on
 *     startup so the first poll reconciles without waiting for an event.
 *  3. `poll()` returns null unless pending > 0. When pending > 0 it resolves
 *     the target docId (from `documentId` option), loads the doc via
 *     `reactor.client.get<T>(id)`, applies `filter` if present, and calls
 *     `onChange(doc, ctx)`. The result is returned as the WorkItem.
 *  4. pending is reset to 0 at the start of each poll drain — multiple
 *     events within a tick coalesce to one `onChange` call.
 *
 * For function-form `documentId`, filtering can't happen in the event
 * handler (the resolver may be async and depend on runtime state), so all
 * matching-documentType events bump pending and poll-time resolution filters.
 */
export function createDocumentChangeTrigger<
  R extends DocumentRegistry = AnyRegistry,
  T extends keyof R & string = keyof R & string,
  TConfig = Record<string, unknown>,
  TState extends { pending: number } = { pending: number },
>(
  options: DocumentChangeTriggerOptions<R, T, TConfig, TState>,
): Trigger<TState, TConfig, R> {
  const initialReconcile = options.initialReconcile !== false;

  return {
    id: options.id,
    type: 'condition',
    state: options.state ?? (() => ({ pending: 0 } as TState)),

    async setup(ctx) {
      const log = ctx.context.log;
      const on = ctx.context.on;
      if (!on) {
        log?.debug(
          `[${options.id}] no event bus on CoreContext — poll-only mode`,
        );
        if (initialReconcile) ctx.state.pending = 1;
        return;
      }

      on('powerhouse:document:changed', (payload) => {
        const documents = payload.documents ?? [];
        const matches = documents.some(
          (d) => d.header?.documentType === options.documentType,
        );
        if (!matches) return;

        if (typeof options.documentId === 'string') {
          const ids = documents.map((d) => d.header?.id);
          if (!ids.includes(options.documentId)) return;
        }

        ctx.state.pending += 1;
        log?.debug(
          `[${options.id}] queued change (pending=${ctx.state.pending})`,
        );
      });

      if (initialReconcile) ctx.state.pending = 1;
    },

    async poll(ctx): Promise<WorkItem | null> {
      if (!ctx.state.pending) return null;
      ctx.state.pending = 0;

      const reactor = await ctx.reactor();
      if (!reactor) {
        ctx.context.log?.debug(
          `[${options.id}] no reactor available, skipping`,
        );
        return null;
      }

      const docId =
        typeof options.documentId === 'function'
          ? await options.documentId(ctx)
          : options.documentId;
      if (!docId) {
        ctx.context.log?.debug(
          `[${options.id}] no target document id resolved, skipping`,
        );
        return null;
      }

      const doc = await reactor.client.get<T>(docId);

      if (options.filter) {
        const ok = await options.filter(doc, ctx);
        if (!ok) return null;
      }

      return options.onChange(doc, ctx);
    },
  };
}
