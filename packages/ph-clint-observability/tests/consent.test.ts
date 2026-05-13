import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { readConsent, writeConsent, promptForConsent, safeDsnDisplay } from '../src/consent.js';

describe('consent persistence', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'consent-test-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it('returns unknown when file is missing', async () => {
    const r = await readConsent(dir);
    expect(r.consent).toBe('unknown');
    expect(r.promptedAt).toBeNull();
  });

  it('round-trips granted/denied/unknown', async () => {
    await writeConsent(dir, { consent: 'granted', promptedAt: '2026-05-13T00:00:00Z' });
    const r1 = await readConsent(dir);
    expect(r1.consent).toBe('granted');
    expect(r1.promptedAt).toBe('2026-05-13T00:00:00Z');

    await writeConsent(dir, { consent: 'denied', promptedAt: null });
    const r2 = await readConsent(dir);
    expect(r2.consent).toBe('denied');
  });

  it('treats malformed JSON as unknown — corrupted file re-prompts', async () => {
    const filePath = join(dir, 'observability-consent.json');
    await writeFile(filePath, 'not-json', 'utf-8');
    const r = await readConsent(dir);
    expect(r.consent).toBe('unknown');
  });

  it('treats unknown consent value in file as unknown', async () => {
    const filePath = join(dir, 'observability-consent.json');
    await writeFile(filePath, JSON.stringify({ consent: 'maybe', promptedAt: null }), 'utf-8');
    const r = await readConsent(dir);
    expect(r.consent).toBe('unknown');
  });

  it('creates parent folder when writing', async () => {
    const nested = join(dir, 'a', 'b', 'c');
    await writeConsent(nested, { consent: 'granted', promptedAt: null });
    const r = await readConsent(nested);
    expect(r.consent).toBe('granted');
  });
});

describe('safeDsnDisplay', () => {
  it('strips the public key from a DSN', () => {
    const display = safeDsnDisplay('https://abc123@sentry.example.com/42');
    expect(display).toBe('https://sentry.example.com/42');
    expect(display).not.toContain('abc123');
  });

  it('returns (invalid DSN) for non-URL strings', () => {
    expect(safeDsnDisplay('not a url')).toBe('(invalid DSN)');
  });
});

describe('promptForConsent', () => {
  function makeStdio(input: string) {
    const stdin = Readable.from([input]);
    const chunks: string[] = [];
    const stdout = new Writable({
      write(chunk, _enc, cb) { chunks.push(chunk.toString()); cb(); },
    });
    return { stdin, stdout, capture: () => chunks.join('') };
  }

  it('returns granted on "y"', async () => {
    const io = makeStdio('y\n');
    const r = await promptForConsent({ cliName: 't', sentryDsn: 'https://abc@host/1', input: io.stdin, output: io.stdout });
    expect(r).toBe('granted');
  });

  it('returns granted on "yes"', async () => {
    const io = makeStdio('yes\n');
    const r = await promptForConsent({ cliName: 't', input: io.stdin, output: io.stdout });
    expect(r).toBe('granted');
  });

  it('returns denied on empty input (default-no)', async () => {
    const io = makeStdio('\n');
    const r = await promptForConsent({ cliName: 't', input: io.stdin, output: io.stdout });
    expect(r).toBe('denied');
  });

  it('returns denied on "n"', async () => {
    const io = makeStdio('n\n');
    const r = await promptForConsent({ cliName: 't', input: io.stdin, output: io.stdout });
    expect(r).toBe('denied');
  });

  it('lists configured destinations in the prompt', async () => {
    const io = makeStdio('\n');
    await promptForConsent({
      cliName: 'myapp',
      sentryDsn: 'https://abc@host/1',
      otelEndpoint: 'http://collector:4318',
      input: io.stdin,
      output: io.stdout,
    });
    const out = io.capture();
    expect(out).toContain('myapp');
    expect(out).toContain('Sentry');
    expect(out).toContain('OpenTelemetry');
    expect(out).toContain('http://collector:4318');
    expect(out).toContain('https://host/1');
    // Public key should not appear
    expect(out).not.toContain('abc@');
  });
});
