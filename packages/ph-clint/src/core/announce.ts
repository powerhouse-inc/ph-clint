/**
 * Service-endpoint announcement helper.
 *
 * Posts the agent's currently-exposed endpoints to a `vetra-cloud-observability`
 * GraphQL endpoint via the `announceClintEndpoints` mutation. Vetra.to reads
 * the resulting state from the observability subgraph and renders it on the
 * agent card.
 *
 * Runtime contract (env vars provided by the platform):
 *   SERVICE_ANNOUNCE_URL    GraphQL endpoint URL
 *   SERVICE_ANNOUNCE_TOKEN  Bearer token (per-pod, minted by the processor)
 *   SERVICE_DOCUMENT_ID     Vetra cloud env document ID this agent belongs to
 *   SERVICE_PREFIX          Prefix that distinguishes this agent within the env
 *
 * The helper is a no-op when any required env var is missing — agents in
 * non-vetra contexts (local dev, REPL, tests) just don't announce.
 */

import type { EndpointType } from './types.js';

/**
 * Endpoint kinds vetra-cloud-observability's `announceClintEndpoints`
 * mutation persists. The receiver accepts arbitrary strings (the GraphQL
 * type is `String!`), but the vetra.to UI only renders these three —
 * other types fall through to a generic display.
 */
export type AnnouncedEndpointType = 'api-graphql' | 'api-mcp' | 'website';

export interface AnnouncedEndpoint {
  /**
   * Agent-chosen ID, e.g. "agent-graphql". Stable across restarts so the
   * UI can correlate (and the observability table keys on it).
   */
  id: string;
  type: AnnouncedEndpointType;
  /** Stringified port for forward-compat with non-numeric ports later. */
  port: string;
  /** Defaults to "enabled" when omitted. */
  status?: 'enabled' | 'disabled';
}

export interface AnnounceConfig {
  /** Defaults to process.env.SERVICE_ANNOUNCE_URL. */
  url?: string;
  /** Defaults to process.env.SERVICE_ANNOUNCE_TOKEN. */
  token?: string;
  /** Defaults to process.env.SERVICE_DOCUMENT_ID. */
  documentId?: string;
  /** Defaults to process.env.SERVICE_PREFIX. */
  prefix?: string;
  /**
   * Optional logger. Called with `('info' | 'warn', message)` so the host
   * decides how to render (CLI banner, Mastra logger, etc.). Defaults to
   * console.warn for warnings only.
   */
  logger?: (level: 'info' | 'warn', message: string) => void;
}

const ANNOUNCE_MUTATION = `
  mutation AnnounceClintEndpoints($input: ClintAnnouncementInput!) {
    announceClintEndpoints(input: $input) {
      ok
      count
    }
  }
`.trim();

/**
 * Map ph-clint's broader EndpointType to the announcement-allowed subset.
 * Returns null for kinds the announcement schema doesn't accept (`other`,
 * `api-rest`) so callers can decide whether to drop them or treat them as
 * something else (e.g. surface api-rest as website, depending on UI).
 */
export function toAnnouncedEndpointType(
  type: EndpointType,
): AnnouncedEndpointType | null {
  if (type === 'api-graphql' || type === 'api-mcp' || type === 'website') {
    return type;
  }
  return null;
}

/**
 * Resolve the announce config from explicit args + env fallbacks. Returns
 * null when any required field is missing (see file header for the
 * no-op-without-env behavior).
 */
export function resolveAnnounceConfig(
  cfg: AnnounceConfig = {},
): {
  url: string;
  token: string;
  documentId: string;
  prefix: string;
} | null {
  const url = cfg.url ?? process.env.SERVICE_ANNOUNCE_URL;
  const token = cfg.token ?? process.env.SERVICE_ANNOUNCE_TOKEN;
  const documentId = cfg.documentId ?? process.env.SERVICE_DOCUMENT_ID;
  const prefix = cfg.prefix ?? process.env.SERVICE_PREFIX;
  if (!url || !token || !documentId || !prefix) return null;
  return { url, token, documentId, prefix };
}

/**
 * POST the agent's current endpoints to the observability subgraph.
 *
 * Replace semantics: the receiver deletes any endpoint not in the
 * provided list, so call this with the FULL set every time — not a
 * delta. Idempotent.
 *
 * Returns:
 *   - `{ ok: true, count }` on a successful upsert (count = endpoints sent).
 *   - `{ ok: false, reason }` on auth failure, transport error, or missing config.
 *
 * Never throws — announcements are best-effort signaling, and the caller
 * shouldn't bring down the agent if the observability endpoint blips.
 */
export async function announceEndpoints(
  endpoints: AnnouncedEndpoint[],
  cfg: AnnounceConfig = {},
): Promise<
  { ok: true; count: number } | { ok: false; reason: string }
> {
  const resolved = resolveAnnounceConfig(cfg);
  const log = cfg.logger ?? ((level, msg) => {
    if (level === 'warn') console.warn(`[ph-clint announce] ${msg}`);
  });

  if (!resolved) {
    log('info', 'no SERVICE_ANNOUNCE_* env vars set — skipping');
    return { ok: false, reason: 'unconfigured' };
  }

  const body = {
    query: ANNOUNCE_MUTATION,
    variables: {
      input: {
        documentId: resolved.documentId,
        prefix: resolved.prefix,
        endpoints: endpoints.map((e) => ({
          id: e.id,
          type: e.type,
          port: e.port,
          status: e.status ?? 'enabled',
        })),
      },
    },
  };

  try {
    const res = await fetch(resolved.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolved.token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      log(
        'warn',
        `announcement failed: HTTP ${res.status} ${res.statusText}`,
      );
      return { ok: false, reason: `http-${res.status}` };
    }
    const json = (await res.json()) as {
      data?: { announceClintEndpoints?: { ok: boolean; count: number } };
      errors?: { message: string }[];
    };
    if (json.errors && json.errors.length > 0) {
      const msg = json.errors[0]?.message ?? 'unknown';
      log('warn', `announcement returned errors: ${msg}`);
      return { ok: false, reason: msg };
    }
    const result = json.data?.announceClintEndpoints;
    if (!result?.ok) {
      log('warn', 'announcement reply missing ok flag');
      return { ok: false, reason: 'invalid-response' };
    }
    return { ok: true, count: result.count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log('warn', `announcement transport error: ${msg}`);
    return { ok: false, reason: 'transport-error' };
  }
}
