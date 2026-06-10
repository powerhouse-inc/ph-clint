import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { observability, observabilityConfigSchema } from '../src/plugin.js';
import type { LifecycleInitContext } from '@powerhousedao/ph-clint';
import { createEventBus, createLogger } from '@powerhousedao/ph-clint';

/** Tiny no-op OTLP receiver so initOtel's NodeSDK has a reachable endpoint. */
async function startDummyReceiver(): Promise<{ url: string; close: () => Promise<void> }> {
  const server = http.createServer((_req, res) => { res.writeHead(200); res.end(); });
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())),
  };
}

function makeCtx(overrides: Partial<LifecycleInitContext> = {}): LifecycleInitContext {
  return {
    config: {},
    cliName: 'test-cli',
    cliVersion: '1.0.0',
    log: createLogger('error', () => {}),
    eventBus: createEventBus(),
    userStoreFolder: '/tmp/should-not-be-touched',
    isInteractive: false,
    bootTimings: { bootStartedAt: 1000, configResolvedAt: 1100, lifecycleInitStartedAt: 1200 },
    ...overrides,
  };
}

describe('observability plugin — configSchema', () => {
  it('declares both fields as optional URLs', () => {
    const parsed = observabilityConfigSchema.parse({});
    expect(parsed.sentryDsn).toBeUndefined();
    expect(parsed.otelExporterOtlpEndpoint).toBeUndefined();
    const withVals = observabilityConfigSchema.parse({
      sentryDsn: 'https://abc@host/1',
      otelExporterOtlpEndpoint: 'http://otel:4318',
    });
    expect(withVals.sentryDsn).toBe('https://abc@host/1');
    expect(withVals.otelExporterOtlpEndpoint).toBe('http://otel:4318');
  });
});

describe('observability plugin — onInit decision tree', () => {
  let store: string;
  beforeEach(async () => { store = await mkdtemp(join(tmpdir(), 'obs-plugin-')); });
  afterEach(async () => { await rm(store, { recursive: true, force: true }); });

  it('no destinations → identity composition, no consent file created', async () => {
    const hook = observability();
    const handle = await hook.onInit(makeCtx({ userStoreFolder: store }));
    expect(handle.contribute).toBeUndefined();
    expect(handle.shutdown).toBeUndefined();
    // No consent file should exist when there's nothing to consent to.
    await expect(readFile(join(store, 'observability-consent.json'), 'utf-8')).rejects.toThrow();
  });

  it('destinations configured + non-interactive + no prior consent → persists denied, returns identity', async () => {
    const hook = observability();
    const handle = await hook.onInit(makeCtx({
      userStoreFolder: store,
      isInteractive: false,
      config: { otelExporterOtlpEndpoint: 'http://otel:4318' },
    }));
    expect(handle.contribute).toBeUndefined();
    const raw = await readFile(join(store, 'observability-consent.json'), 'utf-8');
    expect(JSON.parse(raw).consent).toBe('denied');
  });

  it('destinations configured + non-interactive + persisted denied → no re-prompt, identity', async () => {
    const hook = observability();
    // First run: persists denied
    await hook.onInit(makeCtx({
      userStoreFolder: store,
      isInteractive: false,
      config: { otelExporterOtlpEndpoint: 'http://otel:4318' },
    }));
    // Second run: should still be identity, file unchanged
    const before = await readFile(join(store, 'observability-consent.json'), 'utf-8');
    const handle = await hook.onInit(makeCtx({
      userStoreFolder: store,
      isInteractive: false,
      config: { otelExporterOtlpEndpoint: 'http://otel:4318' },
    }));
    expect(handle.contribute).toBeUndefined();
    const after = await readFile(join(store, 'observability-consent.json'), 'utf-8');
    expect(after).toBe(before);
  });

  it('destinations configured + interactive + promptOverride returns granted → contributes wraps', async () => {
    const receiver = await startDummyReceiver();
    try {
      const hook = observability({ promptOverride: async () => 'granted' });
      const handle = await hook.onInit(makeCtx({
        userStoreFolder: store,
        isInteractive: true,
        config: { otelExporterOtlpEndpoint: receiver.url },
      }));
      expect(handle.contribute).toBeDefined();
      expect(typeof handle.contribute?.command).toBe('function');
      expect(typeof handle.contribute?.routineIteration).toBe('function');
      expect(typeof handle.shutdown).toBe('function');
      await handle.shutdown?.();
      const raw = await readFile(join(store, 'observability-consent.json'), 'utf-8');
      expect(JSON.parse(raw).consent).toBe('granted');
    } finally {
      await receiver.close();
    }
  });

  it('destinations configured + interactive + promptOverride returns denied → identity, persisted denied', async () => {
    const hook = observability({ promptOverride: async () => 'denied' });
    const handle = await hook.onInit(makeCtx({
      userStoreFolder: store,
      isInteractive: true,
      config: { sentryDsn: 'https://abc@host/1' },
    }));
    expect(handle.contribute).toBeUndefined();
    const raw = await readFile(join(store, 'observability-consent.json'), 'utf-8');
    expect(JSON.parse(raw).consent).toBe('denied');
  });

  it('consent: granted + destinations → wraps contributed without re-prompt', async () => {
    const receiver = await startDummyReceiver();
    try {
      const hook = observability({
        promptOverride: async () => { throw new Error('should not prompt'); },
      });
      const { writeConsent } = await import('../src/consent.js');
      await writeConsent(store, { consent: 'granted', promptedAt: new Date().toISOString() });

      const handle = await hook.onInit(makeCtx({
        userStoreFolder: store,
        isInteractive: true,
        config: { otelExporterOtlpEndpoint: receiver.url },
      }));
      expect(handle.contribute).toBeDefined();
      await handle.shutdown?.();
    } finally {
      await receiver.close();
    }
  });

  it('telemetryConsent: granted in config → contributes without prompting and without writing a consent file', async () => {
    const receiver = await startDummyReceiver();
    try {
      const hook = observability({
        promptOverride: async () => { throw new Error('should not prompt'); },
      });
      const handle = await hook.onInit(makeCtx({
        userStoreFolder: store,
        isInteractive: false,
        config: { otelExporterOtlpEndpoint: receiver.url, telemetryConsent: 'granted' },
      }));
      expect(handle.contribute).toBeDefined();
      await handle.shutdown?.();
      // Config consent is authoritative per-run — nothing persisted.
      await expect(readFile(join(store, 'observability-consent.json'), 'utf-8')).rejects.toThrow();
    } finally {
      await receiver.close();
    }
  });

  it('telemetryConsent: denied in config → identity even when interactive, no prompt, no file', async () => {
    const hook = observability({
      promptOverride: async () => { throw new Error('should not prompt'); },
    });
    const handle = await hook.onInit(makeCtx({
      userStoreFolder: store,
      isInteractive: true,
      config: { sentryDsn: 'https://abc@host/1', telemetryConsent: 'denied' },
    }));
    expect(handle.contribute).toBeUndefined();
    await expect(readFile(join(store, 'observability-consent.json'), 'utf-8')).rejects.toThrow();
  });

  it('telemetryConsent in config overrides a persisted denied decision', async () => {
    const receiver = await startDummyReceiver();
    try {
      const { writeConsent } = await import('../src/consent.js');
      await writeConsent(store, { consent: 'denied', promptedAt: new Date().toISOString() });
      const hook = observability();
      const handle = await hook.onInit(makeCtx({
        userStoreFolder: store,
        isInteractive: false,
        config: { otelExporterOtlpEndpoint: receiver.url, telemetryConsent: 'granted' },
      }));
      expect(handle.contribute).toBeDefined();
      await handle.shutdown?.();
      // Stored decision untouched by the per-run override.
      const raw = await readFile(join(store, 'observability-consent.json'), 'utf-8');
      expect(JSON.parse(raw).consent).toBe('denied');
    } finally {
      await receiver.close();
    }
  });
});
