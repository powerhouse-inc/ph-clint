import { defineCli } from 'ph-clint';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';
import { search } from './commands/search.js';
import { summarize } from './commands/summarize.js';
import { createAssistant } from './agents/assistant.js';
import { createMastraAssistant } from './agents/mastra-assistant.js';

// Load .env from the project directory
try {
  const envPath = resolve(import.meta.dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env file not found — rely on environment variables
}

const configSchema = z.object({
  model: z.string().default('anthropic/claude-haiku-4-5').describe('LLM model to use'),
});

const commands = [search, summarize];
const apiKey = process.env.ANTHROPIC_API_KEY;
const useMastra = Boolean(apiKey);

const assistant = useMastra
  ? createMastraAssistant({ commands })
  : createAssistant();

const integrationId = useMastra ? 'mastra' : 'demo';
const welcome = useMastra
  ? 'Research Assistant (Mastra + Claude) — ask me anything, or use /search and /summarize directly'
  : 'Research Assistant (demo mode, no API key) — set ANTHROPIC_API_KEY for real LLM responses';

const cli = defineCli({
  name: 'assist',
  version: '1.0.0',
  description: 'AI research assistant',
  configSchema,
  commands,
  integrations: [{ id: integrationId, agents: [assistant] }],
  defaultCommand: 'agent:assistant',
  interactive: { welcome },
});

cli.run(process.argv);
