import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import type { Readable, Writable } from 'node:stream';

export type ConsentValue = 'unknown' | 'granted' | 'denied';

export interface ConsentRecord {
  consent: ConsentValue;
  promptedAt: string | null;
}

const FILENAME = 'observability-consent.json';

/**
 * Read the consent record. Returns `{ consent: 'unknown', promptedAt: null }`
 * when the file doesn't exist or is malformed (we treat ambiguity as
 * not-yet-asked rather than denied, so a corrupted file re-prompts on next
 * interactive run).
 */
export async function readConsent(userStoreFolder: string): Promise<ConsentRecord> {
  const filePath = path.join(userStoreFolder, FILENAME);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (parsed.consent === 'granted' || parsed.consent === 'denied' || parsed.consent === 'unknown') {
      return {
        consent: parsed.consent,
        promptedAt: typeof parsed.promptedAt === 'string' ? parsed.promptedAt : null,
      };
    }
  } catch {
    // ENOENT or malformed JSON → fall through to unknown
  }
  return { consent: 'unknown', promptedAt: null };
}

export async function writeConsent(userStoreFolder: string, record: ConsentRecord): Promise<void> {
  await fs.mkdir(userStoreFolder, { recursive: true });
  const filePath = path.join(userStoreFolder, FILENAME);
  await fs.writeFile(filePath, JSON.stringify(record, null, 2) + '\n', 'utf-8');
}

/**
 * Truncate a Sentry DSN to host+project for display. A DSN looks like
 * `https://<publicKey>@<host>/<projectId>`. Stripping the public key avoids
 * leaking secret-shaped data into the prompt text.
 */
export function safeDsnDisplay(dsn: string): string {
  try {
    const u = new URL(dsn);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return '(invalid DSN)';
  }
}

export interface PromptOptions {
  cliName: string;
  sentryDsn?: string;
  otelEndpoint?: string;
  input?: Readable;
  output?: Writable;
}

/**
 * Ask the end-user whether to enable telemetry. Returns 'granted' or 'denied'.
 *
 * Default answer (empty input or anything not starting with y/Y) is 'denied' —
 * opt-in stance per privacy norms.
 */
export async function promptForConsent(opts: PromptOptions): Promise<ConsentValue> {
  const rl = readline.createInterface({
    input: opts.input ?? process.stdin,
    output: opts.output ?? process.stdout,
  });
  try {
    const destinations: string[] = [];
    if (opts.sentryDsn) destinations.push(`  • Sentry → ${safeDsnDisplay(opts.sentryDsn)}`);
    if (opts.otelEndpoint) destinations.push(`  • OpenTelemetry → ${opts.otelEndpoint}`);
    const lines = [
      '',
      `${opts.cliName} can share observability data with the following destinations:`,
      ...destinations,
      '',
    ].join('\n');
    (opts.output ?? process.stdout).write(lines);
    const answer = (await rl.question('Enable telemetry? (y/N) ')).trim();
    return /^y(es)?$/i.test(answer) ? 'granted' : 'denied';
  } finally {
    rl.close();
  }
}
