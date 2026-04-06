import { defineCli } from 'ph-clint';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { ascii } from './commands/ascii.js';

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

const commands = [ascii];
const apiKey = process.env.ANTHROPIC_API_KEY;
const useMastra = Boolean(apiKey);

// Lazy-load Mastra only when needed — keeps `assist --help` and `assist ascii` fast
async function createAgent() {
  if (useMastra) {
    const { createMastraAssistant } = await import('./agents/mastra-assistant.js');
    return createMastraAssistant({ commands });
  }
  const { createAssistant } = await import('./agents/assistant.js');
  return createAssistant();
}

const integrationId = useMastra ? 'mastra' : 'demo';
const mode = useMastra
  ? 'Mastra + Claude'
  : 'demo mode, no API key — set ANTHROPIC_API_KEY for real LLM responses';

const logo = `
█└      ▄██    ▀█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████
▌    ,▄███      ████      ¬▀███▀└    \`└▀█▌  ▐███¬  ▐███═  █▌       ▐▌      "▀██-  ████   ██▀▀.    -▀███▀▀▐███⌐  ██▀¬    -▀██        █████
▌  ╓███████▄    ████   ███   █\`  ▄███▄  '█   ██▌    ███  ,█▌  ╟█████▌  ▐███   █   ████   █▀  ▄███▄   █▌  ▐███⌐  █▌  ▐██▌▄▄██   ██████████
▌  ▀█████████r  ████   ▀▀▀  ,▌  j█████-  █▌  ▐█  ▐⌐ "█-  ██▌      ██▌  \`▀▀'  ▄█          █   █████▌  ▐▌  ▐███⌐  ██▄     .▀██      j██████
▌    ▀██████▀   ████   ▄▄▄▄███   ▀███▀   ██⌐  ▀  ██  ▀  ▐██▌  ╟█████▌  j▄  '███   ████   █▄  ▀███▀   █▌   ██▀   █▌▀▀███▌   █   ██████████
▌     ▐███▀     ████   ████████▄;     ;▄████    ▐██⌐    ███▌       ▐▌  ▐██▄  ▀█   ████   ███▄     ,▄████▄    ,▄███▄,     ▄██        █████
█⌐   ▄█▀       ▄█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████
`.trim();

const invertedLogo = logo
  .split('\n')
  .map((line) => `\x1b[7m${line}\x1b[0m`)
  .join('\n');

const welcome = `${invertedLogo}\n\nImage Assistant (${mode})\nAsk me to convert images to ASCII art, or use /ascii directly`;

// Generate or reuse thread ID for session resumption
const args = process.argv.slice(2);
const isInteractive = args.includes('-i') || args.includes('--interactive');
const hasResume = args.includes('--resume');
const threadId = hasResume ? undefined : randomUUID(); // let --resume pass through if provided

async function main() {
  const assistant = await createAgent();

  const cli = defineCli({
    name: 'assist',
    version: '1.0.0',
    description: 'AI-powered image-to-ASCII assistant',
    configSchema,
    commands,
    integrations: [{ id: integrationId, agents: [assistant] }],
    defaultCommand: 'agent:assistant',
    interactive: { welcome },
  });

  // Inject --resume with generated thread ID if entering interactive mode without one
  const argv = [...process.argv];
  if (isInteractive && !hasResume && threadId) {
    argv.push('--resume', threadId);
  }

  await cli.run(argv);

  // Print resume hint after REPL exits
  if (isInteractive) {
    const resumeId = threadId ?? args[args.indexOf('--resume') + 1];
    if (resumeId) {
      console.log(`\n\x1b[2mResume this conversation: assist -i --resume ${resumeId}\x1b[0m`);
    }
  }
}

main();
