import { defineCli, defineMastraIntegration } from 'ph-clint';
import type { Integration } from 'ph-clint';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { ascii } from './commands/ascii.js';
import { saveImage } from './commands/save-image.js';
import { listImages } from './commands/list-images.js';
import { createAssistant } from './agents/assistant.js';

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

const commands = [ascii, saveImage, listImages];
const WORKSPACE_PATH = '.ph/cli/assist';
const apiKey = process.env.ANTHROPIC_API_KEY;
const useMastra = Boolean(apiKey);

const agentInstructions = `You are a helpful assistant with access to image tools and a local file workspace.

## Custom Tools
- **ascii** — Convert an image (URL or local file path) to ASCII art.
- **save-image** — Download an image from a URL and save it to the workspace images/ directory.
- **list-images** — List images currently saved in the workspace images/ directory.

## Workspace
You have a local file workspace. Mastra workspace tools (read_file, write_file, list_files, etc.) \
give you direct filesystem access within the workspace.
Images are stored in the "images/" subdirectory of the workspace.
You can convert saved images to ASCII art by passing their workspace path to the ascii tool.

## Behavior
- When the user provides an image URL, offer to save it and/or convert it to ASCII.
- When the user asks to see their images, use list-images or workspace list_files.
- Keep responses concise. After showing ASCII art, briefly describe what you see.`;

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

const welcome = `${invertedLogo}\n\nImage Assistant (${mode})\nWorkspace: ${WORKSPACE_PATH}/\nAsk me to convert images to ASCII art, save images, or use /ascii directly`;

// Generate or reuse thread ID for session resumption
const args = process.argv.slice(2);
const isInteractive = args.includes('-i') || args.includes('--interactive');
const hasResume = args.includes('--resume');
const threadId = hasResume ? undefined : randomUUID();

async function createIntegration(): Promise<Integration> {
  if (useMastra) {
    return defineMastraIntegration({
      agents: [{ id: 'assistant', name: 'Image Assistant', instructions: agentInstructions }],
      commands,
      workspacePath: WORKSPACE_PATH,
    });
  }
  // Demo mode — no Mastra, no API key
  return { id: 'demo', agents: [createAssistant()] };
}

async function main() {
  const integration = await createIntegration();

  const cli = defineCli({
    name: 'assist',
    version: '1.0.0',
    description: 'AI-powered image-to-ASCII assistant',
    configSchema,
    commands,
    integrations: [integration],
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
