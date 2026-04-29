/**
 * Announce helpers — user-space callbacks for service announcement.
 *
 * Each helper reads `serviceAnnounceUrl` and `serviceAnnounceToken` from
 * `ctx.config` and handles the "no URL" case internally (info log, early
 * return). The framework never throws on announcement failure.
 */
import os from 'node:os';
import type { AnnouncementPayload, CommandContext } from './types.js';

type AnnounceConfig = Record<string, unknown>;

function getAnnounceFields(ctx: CommandContext): {
  url: string | undefined;
  token: string | undefined;
} {
  const config = ctx.config as AnnounceConfig;
  return {
    url: config.serviceAnnounceUrl as string | undefined,
    token: config.serviceAnnounceToken as string | undefined,
  };
}

/**
 * Plain JSON POST announce callback.
 * Posts the full AnnouncementPayload as JSON to the configured URL.
 */
export async function jsonPostAnnounce(
  payload: AnnouncementPayload,
  ctx: CommandContext,
): Promise<void> {
  const { url, token } = getAnnounceFields(ctx);

  if (!url) {
    ctx.log?.info('Service announcement enabled but no URL configured — skipping');
    return;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (err) {
    ctx.log?.warn(`Service announcement failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── GraphQL mutation ──────────────────────────────────────────

const ANNOUNCE_MUTATION = `
  mutation AnnounceClintEndpoints($input: ClintAnnouncementInput!) {
    announceClintEndpoints(input: $input) {
      ok
      count
    }
  }
`.trim();

/**
 * Vetra GraphQL announce callback.
 * Decomposes `serviceAnnounceUrl` into a GraphQL endpoint + `documentId`
 * query parameter, uses `os.hostname()` as prefix, and sends the
 * `announceClintEndpoints` mutation.
 */
export async function vetraGraphqlAnnounce(
  payload: AnnouncementPayload,
  ctx: CommandContext,
): Promise<void> {
  const { url, token } = getAnnounceFields(ctx);

  if (!url) {
    ctx.log?.info('Service announcement enabled but no URL configured — skipping');
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    ctx.log?.warn(`Service announcement URL is invalid: ${url}`);
    return;
  }

  const documentId = parsed.searchParams.get('documentId');
  if (!documentId) {
    ctx.log?.info('Service announcement URL missing documentId parameter — skipping');
    return;
  }

  // Strip query params to get the GraphQL endpoint
  parsed.search = '';
  const graphqlEndpoint = parsed.toString();
  const prefix = os.hostname();

  const endpoints = payload.services.map((s) => ({
    id: s.id,
    type: s.type,
    port: s.port,
    status: s.status === 'ready' ? 'enabled' : 'disabled',
  }));

  const body = {
    query: ANNOUNCE_MUTATION,
    variables: {
      input: {
        documentId,
        prefix,
        endpoints,
      },
    },
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json() as Record<string, unknown>;
    if (result.errors) {
      ctx.log?.warn(`Service announcement GraphQL error: ${JSON.stringify(result.errors)}`);
    }
  } catch (err) {
    ctx.log?.warn(`Service announcement failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
