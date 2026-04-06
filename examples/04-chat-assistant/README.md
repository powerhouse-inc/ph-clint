# 04 — Chat Assistant

A conversational CLI powered by a Mastra agent. Bare text input goes to the agent as a prompt; slash commands provide direct actions. Demonstrates the default subcommand pattern, streaming output, conversation memory, and session resumption.

## What It Shows

- Mastra integration: agent as default subcommand
- Streaming agent responses (AsyncGenerator with typed chunks)
- Conversation memory with thread IDs
- Session resumption across invocations (`--resume`)
- Agent uses CLI commands as tools
- Markdown rendering in terminal

## Code

### Agent and tool definitions

```typescript
import { defineCli, defineCommand, defineMastraIntegration } from 'ph-clint';
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

### Mastra integration

```typescript
const mastra = defineMastraIntegration({
  agents: {
    assistant: {
      model: 'anthropic/claude-haiku-4-5',
      instructions: 'You are a helpful research assistant. Use the search and summarize tools to help users find and understand information.',
      tools: ['search', 'summarize'],  // references CLI commands by id
    },
  },
  memory: {
    backend: 'libsql',  // stored in workspace
  },
});
```

### CLI entry point

```typescript
const cli = defineCli({
  name: 'assist',
  version: '1.0.0',
  description: 'AI research assistant',
  commands: [search, summarize],
  integrations: [mastra],
  defaultCommand: 'agent:assistant',  // bare text → agent
  interactive: {
    welcome: 'Research Assistant — ask me anything, or use /search and /summarize directly',
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
- [ ] `assist -i` launches REPL with welcome message
- [ ] Bare text in REPL routes to the agent (default subcommand)
- [ ] `/search --query X` invokes the search command directly (not through agent)
- [ ] Agent can invoke `search` and `summarize` as tools during a response
- [ ] Tool calls and results are rendered inline during streaming
- [ ] Conversation context persists across turns within a session
- [ ] `--resume <thread-id>` restores a previous conversation
- [ ] Escape interrupts an in-progress agent response, partial output preserved
- [ ] Markdown in agent responses renders correctly in terminal
- [ ] Session thread ID is displayed on exit for later resumption
