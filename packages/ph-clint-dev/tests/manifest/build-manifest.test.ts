import { describe, it, expect, afterEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { z } from 'zod';
import { buildManifest } from '../../src/manifest/build-manifest.js';
import { downloadImage } from '../../src/manifest/image.js';
import { defineCli, defineCommand } from '@powerhousedao/ph-clint';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-test-'));
}

function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Start a local HTTP server that serves an image. */
function serveImage(
  contentType: string,
  body: Buffer,
): Promise<{ url: string; server: http.Server }> {
  return new Promise((resolve) => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(body);
    });
    server.listen(0, () => {
      const addr = server.address() as { port: number };
      resolve({ url: `http://localhost:${addr.port}/image.png`, server });
    });
  });
}

const noop = defineCommand({
  id: 'noop',
  description: 'No-op',
  inputSchema: z.object({}),
  execute: async () => {},
});

/** CLI with no config schema — getMetadata().config will be null. */
const bareCli = defineCli({
  name: 'bare-test',
  version: '0.0.1',
  description: 'Bare CLI',
  commands: [noop],
});

/** CLI with config + secrets — getMetadata().config has env vars. */
const configCli = defineCli({
  name: 'my-cli',
  version: '0.0.1',
  description: 'Config CLI',
  commands: [noop],
  configSchema: z.object({
    model: z.string().default('anthropic/claude-sonnet-4-5').describe('LLM model to use'),
  }),
  secretsSchema: z.object({
    apiKey: z.string().optional().describe('API key'),
  }),
});

const dirs: string[] = [];
const servers: http.Server[] = [];

afterEach(async () => {
  for (const d of dirs) cleanup(d);
  dirs.length = 0;
  for (const s of servers) {
    await new Promise<void>((r) => s.close(() => r()));
  }
  servers.length = 0;
});

describe('buildManifest', () => {
  it('copies manifest with no image as-is', async () => {
    const src = tmpDir();
    const out = path.join(src, 'dist');
    dirs.push(src);

    const manifest = { name: 'test', features: {} };
    fs.writeFileSync(
      path.join(src, 'powerhouse.manifest.json'),
      JSON.stringify(manifest),
    );

    const result = await buildManifest({ srcDir: src, outDir: out, cli: bareCli });
    expect(result.imageDownloaded).toBe(false);
    const written = JSON.parse(fs.readFileSync(result.manifestPath, 'utf-8'));
    expect(written.name).toBe('test');
  });

  it('copies manifest with null image unchanged', async () => {
    const src = tmpDir();
    const out = path.join(src, 'dist');
    dirs.push(src);

    const manifest = { features: { agent: { id: 'bot', image: null } } };
    fs.writeFileSync(
      path.join(src, 'powerhouse.manifest.json'),
      JSON.stringify(manifest),
    );

    const result = await buildManifest({ srcDir: src, outDir: out, cli: bareCli });
    expect(result.imageDownloaded).toBe(false);
    const written = JSON.parse(fs.readFileSync(result.manifestPath, 'utf-8'));
    expect(written.features.agent.image).toBeNull();
  });

  it('downloads image and replaces URL with local path', async () => {
    const src = tmpDir();
    const out = path.join(src, 'dist');
    fs.mkdirSync(out, { recursive: true });
    dirs.push(src);

    const imgData = Buffer.from('PNG_DATA');
    const { url, server } = await serveImage('image/png', imgData);
    servers.push(server);

    const manifest = { features: { agent: { id: 'mybot', image: url } } };
    fs.writeFileSync(
      path.join(src, 'powerhouse.manifest.json'),
      JSON.stringify(manifest),
    );

    const result = await buildManifest({ srcDir: src, outDir: out, cli: bareCli });
    expect(result.imageDownloaded).toBe(true);
    const written = JSON.parse(fs.readFileSync(result.manifestPath, 'utf-8'));
    expect(written.features.agent.image).toBe('./mybot.png');
    expect(fs.existsSync(path.join(out, 'mybot.png'))).toBe(true);
  });

  it('keeps original URL on download failure', async () => {
    const src = tmpDir();
    const out = path.join(src, 'dist');
    dirs.push(src);

    const manifest = {
      features: { agent: { id: 'bot', image: 'http://localhost:1/nope.png' } },
    };
    fs.writeFileSync(
      path.join(src, 'powerhouse.manifest.json'),
      JSON.stringify(manifest),
    );

    const warnings: string[] = [];
    const result = await buildManifest({ srcDir: src, outDir: out, cli: bareCli, warn: (msg) => warnings.push(msg) });

    expect(result.imageDownloaded).toBe(false);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('failed to download agent image');
    const written = JSON.parse(fs.readFileSync(result.manifestPath, 'utf-8'));
    expect(written.features.agent.image).toBe('http://localhost:1/nope.png');
  });

  it('throws when no manifest found', async () => {
    const src = tmpDir();
    dirs.push(src);
    await expect(buildManifest({ srcDir: src, cli: bareCli })).rejects.toThrow(
      'No powerhouse.manifest.json',
    );
  });

  it('injects env map from cli config metadata', async () => {
    const src = tmpDir();
    const out = path.join(src, 'dist');
    dirs.push(src);

    const manifest = { type: 'clint-project', features: {} };
    fs.writeFileSync(
      path.join(src, 'powerhouse.manifest.json'),
      JSON.stringify(manifest),
    );

    const result = await buildManifest({ srcDir: src, outDir: out, cli: configCli });
    const written = JSON.parse(fs.readFileSync(result.manifestPath, 'utf-8'));
    expect(written.env).toEqual({
      model: { env: 'MY_CLI_MODEL', type: 'string', description: 'LLM model to use' },
      apiKey: { env: 'MY_CLI_API_KEY', type: 'string', description: 'API key' },
    });
  });

  it('omits env when cli has no config schema', async () => {
    const src = tmpDir();
    const out = path.join(src, 'dist');
    dirs.push(src);

    const manifest = { type: 'clint-project', features: {} };
    fs.writeFileSync(
      path.join(src, 'powerhouse.manifest.json'),
      JSON.stringify(manifest),
    );

    const result = await buildManifest({ srcDir: src, outDir: out, cli: bareCli });
    const written = JSON.parse(fs.readFileSync(result.manifestPath, 'utf-8'));
    expect(written.env).toBeUndefined();
  });
});

describe('downloadImage', () => {
  it('detects extension from Content-Type: image/png', async () => {
    const dest = tmpDir();
    dirs.push(dest);
    const { url, server } = await serveImage('image/png', Buffer.from('x'));
    servers.push(server);
    const result = await downloadImage(url, dest, 'agent');
    expect(result.filename).toBe('agent.png');
  });

  it('detects extension from Content-Type: image/jpeg', async () => {
    const dest = tmpDir();
    dirs.push(dest);
    const { url, server } = await serveImage('image/jpeg', Buffer.from('x'));
    servers.push(server);
    const result = await downloadImage(url, dest, 'agent');
    expect(result.filename).toBe('agent.jpg');
  });

  it('detects extension from Content-Type: image/svg+xml', async () => {
    const dest = tmpDir();
    dirs.push(dest);
    const { url, server } = await serveImage('image/svg+xml', Buffer.from('x'));
    servers.push(server);
    const result = await downloadImage(url, dest, 'agent');
    expect(result.filename).toBe('agent.svg');
  });

  it('detects extension from Content-Type: image/webp', async () => {
    const dest = tmpDir();
    dirs.push(dest);
    const { url, server } = await serveImage('image/webp', Buffer.from('x'));
    servers.push(server);
    const result = await downloadImage(url, dest, 'agent');
    expect(result.filename).toBe('agent.webp');
  });

  it('falls back to URL path extension when Content-Type unknown', async () => {
    const dest = tmpDir();
    dirs.push(dest);
    // Serve with unknown content type but URL has .svg
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      res.end(Buffer.from('svg data'));
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    servers.push(server);
    const addr = server.address() as { port: number };
    const result = await downloadImage(
      `http://localhost:${addr.port}/assets/icon.svg`,
      dest,
      'agent',
    );
    expect(result.filename).toBe('agent.svg');
  });

  it('defaults to .png as last resort', async () => {
    const dest = tmpDir();
    dirs.push(dest);
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      res.end(Buffer.from('data'));
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    servers.push(server);
    const addr = server.address() as { port: number };
    const result = await downloadImage(
      `http://localhost:${addr.port}/noext`,
      dest,
      'agent',
    );
    expect(result.filename).toBe('agent.png');
  });
});
