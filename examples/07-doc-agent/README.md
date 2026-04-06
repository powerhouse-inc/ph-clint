# 07 — Document Agent

A CLI that combines a Mastra agent with Powerhouse documents. The agent can read and edit documents, and the routine loop reacts to document changes (e.g., new inbox messages). Demonstrates both integrations working together with the routine loop driving autonomous behavior.

## What It Shows

- Mastra + Powerhouse integration together
- Agent uses document operations as tools
- Routine loop with document change triggers
- Event trigger bridges reactor subscriptions into the loop
- Agent skills for Powerhouse document handling
- Work items of type `agent` and `command` in the same loop
- `--wait` mode for autonomous document processing

## Code

### Integrations

```typescript
import {
  defineCli, defineCommand, defineTrigger,
  defineMastraIntegration, definePowerhouseIntegration,
} from 'ph-clint';
import { z } from 'zod';

const configSchema = z.object({
  driveUrl: z.string().describe('Agent manager drive URL'),
  inboxId: z.string().describe('Inbox document ID'),
  wbsId: z.string().describe('WBS document ID'),
});

const powerhouse = definePowerhouseIntegration({
  documentModels: [
    'powerhouse/document-drive',
    'powerhouse/agent-inbox',
    'powerhouse/work-breakdown-structure',
  ],
  drives: (config) => [
    { url: config.driveUrl, sync: true },
  ],
  subscriptions: (config) => [
    { id: config.inboxId, event: 'inbox:updated' },
    { id: config.wbsId, event: 'wbs:updated' },
  ],
  storage: 'memory',
});

const mastra = defineMastraIntegration({
  agents: {
    assistant: {
      model: 'anthropic/claude-haiku-4-5',
      instructions: 'You are a document assistant. Help users manage their Powerhouse documents. Use the available tools to read, edit, and organize documents.',
      tools: ['ls', 'read', 'dispatch', 'inbox', 'reply'],
    },
  },
  memory: { backend: 'libsql' },
  skills: {
    standard: ['powerhouse/document-access', 'powerhouse/document-modeling'],
  },
});
```

### Document-specific commands

```typescript
const inbox = defineCommand({
  id: 'inbox',
  description: 'Show unread inbox messages',
  inputSchema: z.object({}),
  execute: async (_, { reactor, config }) => {
    const doc = await reactor.getDocument(config.inboxId);
    const unread = doc.state.global.threads
      .flatMap(t => t.messages)
      .filter(m => !m.read && m.flow === 'Incoming');
    return {
      text: unread.length === 0
        ? 'No unread messages'
        : unread.map(m => `[${m.sender}] ${m.content.slice(0, 80)}...`).join('\n'),
      data: unread,
    };
  },
});

const reply = defineCommand({
  id: 'reply',
  description: 'Reply to an inbox thread',
  inputSchema: z.object({
    threadId: z.string().describe('Thread ID'),
    message: z.string().describe('Reply message content'),
  }),
  execute: async ({ threadId, message }, { reactor, config }) => {
    await reactor.dispatch(config.inboxId, {
      type: 'SEND_MESSAGE',
      input: { threadId, content: message, flow: 'Outgoing' },
    });
    return { text: `Reply sent to thread ${threadId}` };
  },
});
```

### Routine triggers

```typescript
// Trigger: when inbox gets a new message, create an agent work item
const inboxTrigger = defineTrigger({
  id: 'inbox-message',
  type: 'event',
  eventType: 'inbox:updated',
  toWorkItem: async (event, context) => {
    const doc = await context.reactor.getDocument(context.config.inboxId);
    const unread = doc.state.global.threads
      .flatMap(t => t.messages)
      .filter(m => !m.read && m.flow === 'Incoming');

    if (unread.length === 0) return null;

    return {
      type: 'agent',
      params: {
        agentId: 'assistant',
        prompt: `You have ${unread.length} unread inbox message(s). Read them with /inbox and respond appropriately using /reply.`,
      },
    };
  },
});

// Trigger: when WBS is updated, log it (non-agentic)
const wbsTrigger = defineTrigger({
  id: 'wbs-update',
  type: 'event',
  eventType: 'wbs:updated',
  toWorkItem: async (event) => {
    return {
      type: 'function',
      params: {
        fn: async () => console.log('WBS updated — goals may have changed'),
      },
    };
  },
});
```

### CLI entry point

```typescript
const cli = defineCli({
  name: 'docbot',
  version: '1.0.0',
  description: 'AI-powered document assistant',
  configSchema,
  commands: [inbox, reply, /* ...ls, read, dispatch from 06 */],
  integrations: [powerhouse, mastra],
  triggers: [inboxTrigger, wbsTrigger],
  defaultCommand: 'agent:assistant',
  routine: {
    tickInterval: 2_000,
  },
  interactive: {
    welcome: 'Document Agent — ask me anything or use /inbox to check messages',
  },
});
```

### Usage

```bash
# Autonomous mode: watches inbox, agent responds to messages
docbot --wait

# Interactive mode
docbot -i
> /inbox
# [Alice] Could you create a new document model for invoices?

> Create an invoice document model based on Alice's request
# → (agent streams response, uses /dispatch to create the model)

> /routine status
# Routine: running, triggers: inbox-message (active), wbs-update (active)
> /routine pause
```

## Acceptance Criteria

- [ ] Reactor initializes and mounts the configured drive
- [ ] Document subscriptions fire events when inbox/WBS change
- [ ] Inbox trigger creates an `agent` work item when unread messages arrive
- [ ] Agent can use `inbox`, `reply`, `ls`, `read`, `dispatch` as tools
- [ ] Standard Powerhouse skills are loaded into the agent
- [ ] `docbot --wait` runs the routine loop autonomously, exits on SIGINT
- [ ] In REPL, bare text routes to the agent, `/inbox` invokes the command directly
- [ ] Routine loop and REPL coexist: agent work items execute without blocking input
- [ ] `/routine pause` and `/routine status` work in REPL
- [ ] Agent conversation memory persists across turns
- [ ] WBS trigger fires a non-agentic `function` work item (logging)
