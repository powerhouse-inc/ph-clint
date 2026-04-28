import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  announceEndpoints,
  resolveAnnounceConfig,
  toAnnouncedEndpointType,
} from '../src/core/announce.js';

const ENV_KEYS = [
  'SERVICE_ANNOUNCE_URL',
  'SERVICE_ANNOUNCE_TOKEN',
  'SERVICE_DOCUMENT_ID',
  'SERVICE_PREFIX',
];

describe('toAnnouncedEndpointType', () => {
  it('passes through announce-allowed kinds', () => {
    expect(toAnnouncedEndpointType('api-graphql')).toBe('api-graphql');
    expect(toAnnouncedEndpointType('api-mcp')).toBe('api-mcp');
    expect(toAnnouncedEndpointType('website')).toBe('website');
  });

  it('returns null for kinds the schema does not accept', () => {
    expect(toAnnouncedEndpointType('api-rest')).toBeNull();
    expect(toAnnouncedEndpointType('other')).toBeNull();
  });
});

describe('resolveAnnounceConfig', () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      original[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  });

  it('returns null when nothing is set', () => {
    expect(resolveAnnounceConfig()).toBeNull();
  });

  it('returns null when only some env vars are set', () => {
    process.env.SERVICE_ANNOUNCE_URL = 'https://x/graphql';
    process.env.SERVICE_ANNOUNCE_TOKEN = 't';
    expect(resolveAnnounceConfig()).toBeNull();
  });

  it('resolves from env when all four are set', () => {
    process.env.SERVICE_ANNOUNCE_URL = 'https://x/graphql';
    process.env.SERVICE_ANNOUNCE_TOKEN = 'tok';
    process.env.SERVICE_DOCUMENT_ID = 'doc-1';
    process.env.SERVICE_PREFIX = 'rupert';
    expect(resolveAnnounceConfig()).toEqual({
      url: 'https://x/graphql',
      token: 'tok',
      documentId: 'doc-1',
      prefix: 'rupert',
    });
  });

  it('explicit args override env', () => {
    process.env.SERVICE_ANNOUNCE_URL = 'https://env';
    expect(
      resolveAnnounceConfig({
        url: 'https://override',
        token: 't',
        documentId: 'd',
        prefix: 'p',
      }),
    ).toEqual({
      url: 'https://override',
      token: 't',
      documentId: 'd',
      prefix: 'p',
    });
  });
});

describe('announceEndpoints', () => {
  let originalFetch: typeof globalThis.fetch | undefined;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch as typeof globalThis.fetch;
  });

  const cfg = {
    url: 'https://obs/graphql',
    token: 'tok',
    documentId: 'doc-1',
    prefix: 'rupert',
  };

  it('returns unconfigured when env is missing and no cfg passed', async () => {
    globalThis.fetch = jest.fn() as unknown as typeof globalThis.fetch;
    const result = await announceEndpoints([]);
    expect(result).toEqual({ ok: false, reason: 'unconfigured' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('POSTs the mutation with bearer token and returns ok on success', async () => {
    const mockFetch = jest.fn(async () =>
      ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          data: { announceClintEndpoints: { ok: true, count: 2 } },
        }),
      }) as unknown as Response,
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    const endpoints = [
      { id: 'graphql', type: 'api-graphql' as const, port: '12345' },
      { id: 'mcp', type: 'api-mcp' as const, port: '12345', status: 'enabled' as const },
    ];
    const result = await announceEndpoints(endpoints, cfg);

    expect(result).toEqual({ ok: true, count: 2 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://obs/graphql');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    const body = JSON.parse(init.body as string) as {
      variables: { input: { documentId: string; prefix: string; endpoints: unknown[] } };
    };
    expect(body.variables.input.documentId).toBe('doc-1');
    expect(body.variables.input.prefix).toBe('rupert');
    expect(body.variables.input.endpoints).toHaveLength(2);
  });

  it('defaults missing status to "enabled" in the request body', async () => {
    const mockFetch = jest.fn(async () =>
      ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          data: { announceClintEndpoints: { ok: true, count: 1 } },
        }),
      }) as unknown as Response,
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    await announceEndpoints(
      [{ id: 'x', type: 'website', port: '8080' }],
      cfg,
    );
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    const body = JSON.parse(init.body as string) as {
      variables: { input: { endpoints: { status: string }[] } };
    };
    expect(body.variables.input.endpoints[0].status).toBe('enabled');
  });

  it('returns http-<status> on non-2xx', async () => {
    globalThis.fetch = jest.fn(async () =>
      ({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      }) as unknown as Response,
    ) as unknown as typeof globalThis.fetch;

    const result = await announceEndpoints([], cfg);
    expect(result).toEqual({ ok: false, reason: 'http-401' });
  });

  it('returns transport-error when fetch throws', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new Error('connect refused');
    }) as unknown as typeof globalThis.fetch;

    const result = await announceEndpoints([], cfg);
    expect(result).toEqual({ ok: false, reason: 'transport-error' });
  });

  it('surfaces graphql errors as the reason', async () => {
    globalThis.fetch = jest.fn(async () =>
      ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          errors: [{ message: 'UNAUTHORIZED' }],
        }),
      }) as unknown as Response,
    ) as unknown as typeof globalThis.fetch;

    const result = await announceEndpoints([], cfg);
    expect(result).toEqual({ ok: false, reason: 'UNAUTHORIZED' });
  });
});
