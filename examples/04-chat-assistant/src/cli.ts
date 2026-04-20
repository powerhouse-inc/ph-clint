import { defineCli } from '@powerhousedao/ph-clint';
import { configSchema } from './framework.js';
import { ascii } from './commands/ascii.js';
import { saveImage } from './commands/save-image.js';
import { listImages } from './commands/list-images.js';
import { createAssistant } from './agents/assistant.js';

// ── Agent instructions ────────────────────────────────────────────

const instructions = `You are a helpful assistant with access to image tools and a local file workspace.

## Tools
- **ascii** — Convert an image (URL or local file path) to ASCII art.
- **save-image** — Download an image from a URL and save it to the workspace.
- **list-images** — List images currently saved in the workspace.

## Behavior
- When the user provides an image URL, offer to save it and/or convert it to ASCII.
- When the user asks to see their images, use list-images.
- Keep responses concise. After showing ASCII art, briefly describe what you see.`;

// ── Logo (inverse-video rendered) ─────────────────────────────────

const logo =
  '\x1b[7m█└      ▄██    ▀█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████\x1b[0m\n' +
  '\x1b[7m▌    ,▄███      ████      ¬▀███▀└    `└▀█▌  ▐███¬  ▐███═  █▌       ▐▌      "▀██-  ████   ██▀▀.    -▀███▀▀▐███⌐  ██▀¬    -▀██        █████\x1b[0m\n' +
  '\x1b[7m▌  ╓███████▄    ████   ███   █`  ▄███▄  \'█   ██▌    ███  ,█▌  ╟█████▌  ▐███   █   ████   █▀  ▄███▄   █▌  ▐███⌐  █▌  ▐██▌▄▄██   ██████████\x1b[0m\n' +
  '\x1b[7m▌  ▀█████████r  ████   ▀▀▀  ,▌  j█████-  █▌  ▐█  ▐⌐ "█-  ██▌      ██▌  `▀▀\'  ▄█          █   █████▌  ▐▌  ▐███⌐  ██▄     .▀██      j██████\x1b[0m\n' +
  '\x1b[7m▌    ▀██████▀   ████   ▄▄▄▄███   ▀███▀   ██⌐  ▀  ██  ▀  ▐██▌  ╟█████▌  j▄  \'███   ████   █▄  ▀███▀   █▌   ██▀   █▌▀▀███▌   █   ██████████\x1b[0m\n' +
  '\x1b[7m▌     ▐███▀     ████   ████████▄;     ;▄████    ▐██⌐    ███▌       ▐▌  ▐██▄  ▀█   ████   ███▄     ,▄████▄    ,▄███▄,     ▄██        █████\x1b[0m\n' +
  '\x1b[7m█⌐   ▄█▀       ▄█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████\x1b[0m';

// ── CLI ───────────────────────────────────────────────────────────

const cli = defineCli({
  name: 'assist',
  version: '1.0.0',
  description: 'AI-powered image-to-ASCII assistant',
  configSchema,
  commands: [ascii, saveImage, listImages],

  interactive: {
    welcome: ({ config }) => {
      const mode = config.apiKey
        ? `Mastra + ${config.model}`
        : 'demo mode — set ASSIST_API_KEY for real LLM responses';
      return `${logo}\n\nImage Assistant (${mode})\nAsk me to convert images to ASCII art, save images, or use /ascii directly`;
    },
  },
});

cli.configureAgent(async (ctx) => {
  if (!ctx.config.apiKey) return createAssistant();

  // Lazy-load Mastra only when an API key is configured
  const { createMastraHelpers } = await import('@powerhousedao/ph-clint/mastra');
  const { Agent } = await import('@mastra/core/agent');
  const m = createMastraHelpers(ctx);

  return m.wrapAgent(new Agent({
    id: 'assistant',
    name: 'Image Assistant',
    instructions: `${instructions}\n\nWorkspace: ${ctx.workdir}`,
    model: ctx.config.model,
    tools: await m.getTools(),
    workspace: await m.createWorkspace(),
    memory: await m.createMemory(),
  }));
});

cli.run(process.argv);
