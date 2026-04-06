# 08 — Reactor Dev

The full-featured reference implementation: a multi-agent CLI for Powerhouse Reactor Package development. Multiple agents, a background Reactor service, the routine loop driven by inbox and WBS triggers, skills, dynamic MCP tool discovery, and session management. This is the target that mirrors and replaces the `agent-rupert-cli` prototype.

## What It Shows

- Everything from examples 01–07 combined
- Multi-agent setup with runtime switching (`--agent`)
- Background service: Reactor (Vetra) managed by ServiceExecutor
- Dynamic tool composition: MCP tools from running Reactor added to agent at runtime
- Full skill set: Powerhouse primer + document modeling + editor creation + project management
- Routine loop with inbox and WBS triggers driving autonomous agent work
- Agent context switching (skill → scenario → task)
- Middleware: auth check, workspace init, logging
- Transport-agnostic: terminal REPL + MCP server exposure

## Code

### Configuration

```typescript
import {
  defineCli, defineCommand, defineService, defineTrigger,
  defineMastraIntegration, definePowerhouseIntegration,
} from 'ph-clint';
import { z } from 'zod';

const configSchema = z.object({
  driveUrl: z.string().describe('Agent manager drive URL'),
  inboxId: z.string().describe('Inbox document ID'),
  wbsId: z.string().describe('WBS document ID'),
  projectsDir: z.string().default('./projects').describe('Reactor projects directory'),
  connectPort: z.number().default(5000).describe('Vetra Connect port'),
  switchboardPort: z.number().default(6100).describe('Vetra Switchboard port'),
  startupTimeout: z.number().default(90_000).describe('Vetra startup timeout (ms)'),
});

// ENV mapping auto-generated:
// RDEV_DRIVE_URL, RDEV_INBOX_ID, RDEV_WBS_ID, RDEV_PROJECTS_DIR,
// RDEV_CONNECT_PORT, RDEV_SWITCHBOARD_PORT, RDEV_STARTUP_TIMEOUT
```

### Powerhouse integration

```typescript
const powerhouse = definePowerhouseIntegration({
  documentModels: [
    'powerhouse/document-drive',
    'powerhouse/document-model',
    'powerhouse/document-editor',
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
});
```

### Mastra integration with multiple agents

```typescript
const mastra = defineMastraIntegration({
  agents: {
    'reactor-dev': {
      model: 'anthropic/claude-haiku-4-5',
      instructions: (config) => `You are a Reactor Package developer. Projects dir: ${config.projectsDir}`,
      tools: [
        'init-project', 'run-project', 'stop-project', 'project-status',
        'project-logs', 'inbox', 'reply', 'ls', 'read', 'dispatch',
      ],
      dynamicTools: {
        // MCP tools from running Reactor are merged in at runtime
        mcp: (context) => context.services.get('reactor')?.endpoints?.mcpUrl,
      },
    },
    'architect': {
      model: 'anthropic/claude-sonnet-4-5',
      instructions: 'You are a Powerhouse architect. Design document models and coordinate development.',
      tools: ['inbox', 'reply', 'ls', 'read', 'dispatch'],
    },
  },
  memory: { backend: 'libsql' },
  skills: {
    standard: [
      'powerhouse/document-access',
      'powerhouse/document-modeling',
    ],
    custom: [
      'skills-src/reactor-package-project-management',
      'skills-src/document-editor-creation',
      'skills-src/handle-stakeholder-message',
    ],
  },
});
```

### Background Reactor service

```typescript
const reactor = defineService({
  id: 'reactor',
  label: 'Vetra (Reactor)',
  command: (config) => `ph vetra --watch --connect-port ${config.connectPort} --switchboard-port ${config.switchboardPort}`,
  cwd: (config) => `${config.projectsDir}/${config.activeProject}`,
  readiness: {
    patterns: [
      {
        pattern: /Connect.*http:\/\/[\w.:]+:(\d+)/,
        name: 'connect',
        captures: { connectUrl: 0, connectPort: 1 },
      },
      {
        pattern: /Switchboard.*http:\/\/[\w.:]+:(\d+)/,
        name: 'switchboard',
        captures: { switchboardUrl: 0, switchboardPort: 1 },
      },
      {
        pattern: /MCP.*endpoint:\s*(http:\/\/[\w.:\/]+)/,
        name: 'mcp',
        captures: { mcpUrl: 1 },
      },
    ],
    timeout: (config) => config.startupTimeout,
    allRequired: true,
  },
  shutdown: { signal: 'SIGTERM', timeout: 10_000 },
});
```

### Project management commands

```typescript
const initProject = defineCommand({
  id: 'init-project',
  description: 'Initialize a new Reactor Package project',
  inputSchema: z.object({
    name: z.string().regex(/^[a-zA-Z0-9-_]+$/).describe('Project name (kebab-case)'),
  }),
  execute: async ({ name }, { processes, config }) => {
    const result = await processes.run(`ph init ${name}`, {
      cwd: config.projectsDir,
      label: `init:${name}`,
      timeout: 120_000,
    });
    return { text: result.success ? `Initialized ${name}` : `Init failed: ${result.error}` };
  },
});

const runProject = defineCommand({
  id: 'run-project',
  description: 'Start a Reactor project (Vetra)',
  inputSchema: z.object({
    name: z.string().describe('Project name'),
  }),
  execute: async ({ name }, { services, config }) => {
    config.activeProject = name;
    await services.start('reactor');
    const endpoints = services.get('reactor')?.endpoints;
    return {
      text: [
        `Reactor running for ${name}:`,
        `  Connect: ${endpoints?.connectUrl}`,
        `  Switchboard: ${endpoints?.switchboardUrl}`,
        `  MCP: ${endpoints?.mcpUrl}`,
      ].join('\n'),
      data: endpoints,
    };
  },
});

const stopProject = defineCommand({
  id: 'stop-project',
  description: 'Stop the running Reactor project',
  inputSchema: z.object({}),
  execute: async (_, { services }) => {
    await services.stop('reactor');
    return { text: 'Reactor stopped' };
  },
});
```

### Routine triggers

```typescript
const inboxTrigger = defineTrigger({
  id: 'inbox-message',
  type: 'event',
  eventType: 'inbox:updated',
  toWorkItem: async (event, context) => {
    const doc = await context.reactor.getDocument(context.config.inboxId);
    const hasUnread = doc.state.global.threads
      .flatMap(t => t.messages)
      .some(m => !m.read && m.flow === 'Incoming');
    if (!hasUnread) return null;

    return {
      type: 'skill',
      params: {
        agentId: 'reactor-dev',
        skillName: 'handle-stakeholder-message',
        context: { inboxId: context.config.inboxId },
      },
      callbacks: {
        onSuccess: () => console.log('Inbox message handled'),
        onFailure: (err) => console.log(`Failed to handle message: ${err}`),
      },
    };
  },
});

const wbsGoalTrigger = defineTrigger({
  id: 'wbs-goal',
  type: 'event',
  eventType: 'wbs:updated',
  toWorkItem: async (event, context) => {
    const doc = await context.reactor.getDocument(context.config.wbsId);
    const nextGoal = findNextLeafGoal(doc.state.global);
    if (!nextGoal) return null;

    return {
      type: 'skill',
      params: {
        agentId: 'reactor-dev',
        skillName: nextGoal.resolvedSkill,
        context: { goal: nextGoal },
      },
      callbacks: {
        onSuccess: async () => markGoalCompleted(context.reactor, nextGoal),
        onFailure: async () => markGoalBlocked(context.reactor, nextGoal),
      },
    };
  },
});
```

### Middleware

```typescript
const authMiddleware = {
  id: 'auth',
  before: async (context) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
  },
};

const loggingMiddleware = {
  id: 'logging',
  before: async (context) => {
    context.log(`> ${context.commandId} ${JSON.stringify(context.args)}`);
  },
  after: async (context) => {
    context.log(`< ${context.commandId} (${context.duration}ms)`);
  },
};
```

### CLI entry point

```typescript
const cli = defineCli({
  name: 'rdev',
  version: '1.0.0',
  description: 'Reactor Package Development Agent',
  configSchema,
  commands: [initProject, runProject, stopProject, /* ...all others */],
  integrations: [powerhouse, mastra],
  services: [reactor],
  triggers: [inboxTrigger, wbsGoalTrigger],
  middleware: [authMiddleware, loggingMiddleware],
  defaultCommand: 'agent:reactor-dev',
  routine: {
    tickInterval: 2_000,
    idleInterval: 500,
  },
  interactive: {
    welcome: 'Reactor Dev Agent — ask me anything or use /help for commands',
  },
  transports: {
    mcp: { enabled: true, port: 4112 },  // expose as MCP server too
  },
});
```

### Usage

```bash
# Autonomous mode
rdev --wait --agent reactor-dev

# Interactive mode
rdev -i
> /init-project --name acme-invoicing
# Initialized acme-invoicing

> /run-project --name acme-invoicing
# ✓ Vetra (Reactor) is ready
# Reactor running for acme-invoicing:
#   Connect: http://localhost:5000
#   Switchboard: http://localhost:6100
#   MCP: http://localhost:6100/mcp

> Create a document model for invoices with line items, totals, and payment status
# → (agent streams, uses MCP tools from running Reactor)
# → ▶ mcp__active-project-vetra__addActions(...)
# → ✓ Document model created

> /routine status
# Routine: running
# Triggers: inbox-message (active), wbs-goal (active)
# Queue: empty

# Switch agent
> /agent architect
# Switched to architect agent

> Review the invoice document model and suggest improvements
# → (architect agent responds with architectural guidance)

# Resume later
rdev -i --resume abc-123
```

## Acceptance Criteria

- [ ] All features from examples 01–07 work
- [ ] Multi-agent: `--agent reactor-dev` and `--agent architect` select different agents
- [ ] `/agent <name>` switches agents in REPL
- [ ] Reactor service starts as background process with readiness detection
- [ ] MCP tools from running Reactor merge into agent toolset dynamically
- [ ] Inbox trigger creates `skill` work items for incoming messages
- [ ] WBS trigger creates `skill` work items for available goals
- [ ] Goal completion/blocking callbacks update WBS document
- [ ] Skills are compiled from Handlebars templates with config injection
- [ ] Auth middleware blocks execution when API key is missing
- [ ] Logging middleware logs command entry/exit with timing
- [ ] `rdev --wait` runs autonomously, processing inbox and WBS
- [ ] MCP server transport exposes CLI commands to external clients
- [ ] Session resumption works across agent switches
- [ ] Config resolves through all 5 layers (ENV > .env > local > global > defaults)
- [ ] `RDEV_CONNECT_PORT=5001 rdev -i` overrides the Vetra Connect port
