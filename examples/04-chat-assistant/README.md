# 04 — Chat Assistant

A conversational CLI powered by a Mastra agent. Bare text input goes to the agent as a prompt; slash commands provide direct actions. Demonstrates the agent factory pattern, streaming output, conversation memory, and session resumption.

## What It Shows

- Agent factory on `CliOptions.agent.default` — lazy, user-controlled agent creation
- `createMastraHelpers()` from `ph-clint/mastra` for workspace, memory, and tool helpers
- Streaming agent responses (AsyncGenerator with typed chunks)
- Conversation memory with thread IDs
- Session resumption across invocations (`--resume`)
- Agent uses CLI commands as tools
- `Resolvable<string>` for dynamic welcome message based on config
- Markdown rendering in terminal

## Code

### Agent and tool definitions

```typescript
import { defineCli, defineCommand } from 'ph-clint';
import { z } from 'zod';

const search = defineCommand({
  id: 'search',
  description: 'Search the web for information',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().default(5).describe('Max results'),
  }),
  execute: async ({ query, limit }) => {
    const results = await searchWeb(query, limit);
    return { data: results };
  },
});

const summarize = defineCommand({
  id: 'summarize',
  description: 'Summarize a URL',
  inputSchema: z.object({
    url: z.string().url().describe('URL to summarize'),
  }),
  execute: async ({ url }) => {
    const content = await fetchAndExtract(url);
    return { text: content.summary, data: content };
  },
});
```

### Config schema with API key

```typescript
const configSchema = z.object({
  apiKey: z.string().optional().describe('Anthropic API key'),
  model: z.string().default('anthropic/claude-haiku-4-5').describe('LLM model'),
});
```

### CLI with agent factory

```typescript
const cli = defineCli({
  name: 'assist',
  version: '1.0.0',
  description: 'AI research assistant',
  configSchema,
  commands: [search, summarize],

  agent: {
    default: async (ctx) => {
      if (!ctx.config.apiKey) {
        return createDemoAssistant(); // no API key → demo mode
      }
      const { createMastraHelpers } = await import('ph-clint/mastra');
      const { Agent } = await import('@mastra/core/agent');
      const m = createMastraHelpers(ctx);

      return m.wrapAgent(new Agent({
        id: 'assistant',
        instructions: 'You are a helpful research assistant.',
        model: ctx.config.model as string,
        tools: await m.getTools(),
        workspace: await m.createWorkspace(),
        memory: await m.createMemory(),
      }));
    },
  },

  interactive: {
    welcome: ({ config }) =>
      `Research Assistant (${config.apiKey ? config.model : 'demo mode — set apiKey for real LLM'})\n` +
      'Ask me anything, or use /search and /summarize directly',
  },
});
```

### Usage

```bash
# One-shot prompt (command mode)
assist "What are the latest developments in battery technology?"

# Interactive mode
assist -i
> What's the current state of fusion energy research?
# → (streaming agent response with tool calls visible)
# → ▶ search("fusion energy 2026 progress")
# → ✓ search → 5 results
# → Based on recent developments...

> /search --query "ITER timeline"    # direct command, bypasses agent
> /summarize --url https://...

# Resume a previous session
assist -i --resume abc-123-def
```

### Streaming output

```
> Summarize the top 3 results about quantum computing

▶ search("quantum computing breakthroughs 2026")
✓ search → 5 results

▶ summarize("https://example.com/quantum-2026")
✓ summarize → 342 words

Based on the search results, here are the top developments:

1. **Error correction milestone** — ...
2. **Photonic processors** — ...
3. **Quantum networking** — ...
```

## Acceptance Criteria

- [ ] `assist "question"` sends prompt to agent, streams response to stdout, exits
- [ ] `assist -i` launches REPL with welcome message (dynamic based on config)
- [ ] Bare text in REPL routes to the agent (`agent.default` factory)
- [ ] `/search --query X` invokes the search command directly (not through agent)
- [ ] Agent can invoke `search` and `summarize` as tools during a response
- [ ] Tool calls and results are rendered inline during streaming
- [ ] Conversation context persists across turns within a session
- [ ] `--resume <thread-id>` restores a previous conversation
- [ ] Escape interrupts an in-progress agent response, partial output preserved
- [ ] Markdown in agent responses renders correctly in terminal
- [ ] Session thread ID is displayed on exit for later resumption
- [ ] Without API key, demo mode works without importing Mastra (lazy loading)
