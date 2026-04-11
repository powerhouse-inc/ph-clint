# ph-clint Developer Guide

Build CLI tools that work as command-line programs, interactive REPLs, and AI agent harnesses — all from a single set of Zod-based command definitions.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Defining Commands](#defining-commands)
- [Defining a CLI](#defining-a-cli)
- [Configuration](#configuration)
- [Workspace Persistence](#workspace-persistence)
- [Interactive Mode (REPL)](#interactive-mode-repl)
- [Triggers and Routine Loop](#triggers-and-routine-loop)
- [Process Management](#process-management)
- [Service Management](#service-management)
- [AI Agent Integration (Mastra)](#ai-agent-integration-mastra)
- [Streaming Output](#streaming-output)
- [Events](#events)
- [CLI Metadata](#cli-metadata)
- [Handlebars Templates](#handlebars-templates)
- [Conversation Logging](#conversation-logging)
- [Testing](#testing)
- [API Reference](#api-reference)

---

## Quick Start

### Installation

```bash
pnpm add ph-clint zod
```

### Minimal CLI

```typescript
#!/usr/bin/env node
import { defineCli, defineCommand } from 'ph-clint';
import { z } from 'zod';

const greet = defineCommand({
  id: 'greet',
  description: 'Greet someone by name',
  inputSchema: z.object({
    name: z.string().describe('Name of the person to greet'),
    loud: z.boolean().default(false).describe('Shout the greeting'),
  }),
  execute: async ({ name, loud }) => {
    const msg = `Hello, ${name}!`;
    return loud ? msg.toUpperCase() : msg;
  },
});

const cli = defineCli({
  name: 'hello',
  version: '1.0.0',
  description: 'A minimal ph-clint example',
  commands: [greet],
  interactive: {
    welcome: 'Hello World CLI — type /help for commands',
  },
});

cli.run(process.argv);
```

This gives you:

- **Command mode**: `hello greet --name World --loud`
- **Interactive mode**: `hello -i`, then type `/greet --name World`
- **Built-in help**: `hello --help`, `hello greet --help`, or `/help` in REPL
- **Auto-completion**: Tab completion for commands, flags, and enum values

---

## Core Concepts

### Commands

Commands are the atomic unit of ph-clint. A command is defined once and works as:

- A CLI subcommand (`mycli greet --name World`)
- A REPL command (`/greet --name World`)
- An MCP tool (when served via MCP transport)
- An AI agent tool (when using Mastra integration)

### Two Modes

| Mode | Entry | Behavior |
|------|-------|----------|
| **Command mode** | `mycli cmd --args` | One-shot execution, then exit |
| **Interactive mode** | `mycli -i` | Persistent REPL with `/command` syntax |

Both modes share the same command definitions and routing logic.

### Workspace vs Context

- **Workspace** — the user's working directory (defaults to `cwd`, configurable via `--workdir`)
- **Context folder** — `{workspace}/.ph/` is ph-clint's managed state area (config, databases, persisted data)

---

## Defining Commands

### Basic Command

```typescript
import { defineCommand } from 'ph-clint';
import { z } from 'zod';

export const greet = defineCommand({
  id: 'greet',
  description: 'Greet someone by name',
  inputSchema: z.object({
    name: z.string().describe('Name of the person to greet'),
    loud: z.boolean().default(false).describe('Shout the greeting'),
  }),
  execute: async ({ name, loud }) => {
    const msg = `Hello, ${name}!`;
    return loud ? msg.toUpperCase() : msg;
  },
});
```

The `inputSchema` is a Zod object schema. Each field becomes a CLI flag: `--name`, `--loud`. Field descriptions from `.describe()` are used in generated help text.

### Return Values

Commands can return:

- **A string** — displayed directly
- **An object `{ text, data }`** — `text` is displayed to the user, `data` is the structured result (useful for agent tool calls and programmatic access)

```typescript
execute: async ({ title }, { workspace, config }) => {
  const task = { id: crypto.randomUUID(), title };
  await workspace.storeJsonObject('tasks.json', [task]);
  return { text: `Added: ${task.title}`, data: task };
},
```

### Using CommandContext

The `execute` function receives input as its first argument and `CommandContext` as its second:

```typescript
execute: async (input, context) => {
  context.workdir;     // Resolved working directory (string)
  context.workspace;   // WorkdirStore — persistent file-based state
  context.config;      // Typed config object (from configSchema)
  context.stdout;      // Output function for streaming text
  context.log;         // Logger (debug/info/warn/error)
  context.routine;     // Routine loop control (if triggers configured)
  context.processes;   // ProcessManager (run shell commands)
  context.services;    // ServiceManager (if services configured)
  context.emit;        // Event emitter function
}
```

### Parameter Prompting

In interactive mode, commands can prompt for missing parameters:

```typescript
export const add = defineCommand({
  id: 'add',
  description: 'Add a new task',
  inputSchema: z.object({
    title: z.string().describe('Task title'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
  }),
  prompt: {
    promptForDefaults: false,      // Don't prompt for fields with defaults
    promptOptional: ['priority'],  // Prompt for these optional fields
  },
  execute: async ({ title, priority }, { workspace, config }) => {
    // priority will be prompted if not provided via flags
    const p = priority ?? config.defaultPriority;
    // ...
  },
});
```

### Typed Commands

Commands support generic type parameters for full type safety:

```typescript
const inputSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9-]+$/),
});

const init = defineCommand<typeof inputSchema, { text: string }, Config>({
  id: 'init',
  description: 'Initialize a project',
  inputSchema,
  execute: async ({ name }, { config }) => {
    // `name` is typed as string, `config` is typed as Config
    return { text: `Created ${name}` };
  },
});
```

---

## Defining a CLI

### Basic CLI

```typescript
import { defineCli } from 'ph-clint';

const cli = defineCli({
  name: 'mycli',
  version: '1.0.0',
  description: 'My CLI tool',
  commands: [cmd1, cmd2, cmd3],
});

cli.run(process.argv);
```

### Full CLI Options

```typescript
const cli = defineCli({
  name: 'mycli',
  version: '1.0.0',
  description: 'My CLI tool',               // Static string or Resolvable function
  commands: [cmd1, cmd2],
  configSchema: myConfigSchema,               // Zod schema for typed config
  interactive: {
    welcome: 'My CLI — type /help',           // Static string or Resolvable function
  },
  triggers: [myTrigger],                      // Routine loop triggers
  routine: { tickInterval: 2000 },            // Routine loop timing
  services: [myService],                      // Managed background services
  events: { 'service:ready': handler },       // Event handlers
  secretsSchema: mySecretsSchema,             // Zod schema for sensitive config (censored)
  skills: {                                    // Agent skill management
    sources: ['./skills', './dist/skills'],    // Candidate dirs (first existing wins)
    agents: { 'my-agent': ['skill-a'] },      // Per-agent skill assignments
  },
  workdir: '/custom/default/path',            // Implementation-level workdir override
  configDefaults: { key: 'value' },           // Default config values
});
```

### Resolvable Values

`description` and `interactive.welcome` accept either a static string or a function that receives the resolved config and workdir:

```typescript
interactive: {
  welcome: ({ config, workdir }) => {
    const mode = config.apiKey ? 'LLM mode' : 'demo mode';
    return `My CLI (${mode})\nWorking in: ${workdir}`;
  },
},
```

### Built-in Commands

When you define a CLI, these commands are automatically available:

| Command | Condition | Description |
|---------|-----------|-------------|
| `cli-docs` | Always | Shows full CLI documentation |
| `config` | When `configSchema` provided | View/modify configuration |
| `{service} --action up/down/restart` | When `services` provided | Per-service management |

### The `Cli` Object

`defineCli()` returns a `Cli` object with these methods:

```typescript
cli.run(argv, options?)          // Run CLI (command mode or REPL)
cli.execute(commandId, args)     // Execute a command directly
cli.parseArgs(commandId, argv)   // Parse CLI args for a command
cli.getCommand(id)               // Get a command by ID
cli.listCommands()               // List all registered commands
cli.generateHelp()               // Generate help text
cli.generateCommandHelp(id)      // Help for a specific command
cli.generateCompletion(shell)    // Shell completion script ('bash'|'zsh'|'fish')
cli.configEnvVars()              // List config env var mappings
cli.getMetadata()                // JSON-serializable CLI metadata
cli.setAgentLoader(loader)       // Set lazy agent loader (for Mastra)
```

### RunOptions

`cli.run()` accepts optional `RunOptions` for testing and embedding:

```typescript
cli.run(process.argv, {
  exit: (code) => { /* override process.exit */ },
  stdout: (msg) => { /* capture stdout */ },
  stderr: (msg) => { /* capture stderr */ },
  interactiveInput: asyncIterable,  // Headless REPL mode (feed input programmatically)
  resume: 'thread-id',             // Resume agent conversation
  workdir: '/override/path',       // Override working directory
  configFile: './myconfig.json',   // Override config file path
  logLevel: 'debug',               // 'debug' | 'info' | 'warn' | 'error'
});
```

---

## Configuration

### Defining a Config Schema

Config is defined via a Zod object schema. Each field auto-maps to an environment variable:

```typescript
import { z } from 'zod';

const configSchema = z.object({
  defaultPriority: z.enum(['low', 'medium', 'high']).default('medium')
    .describe('Default priority for new tasks'),
  apiKey: z.string().optional()
    .describe('API key for the service'),
  maxRetries: z.number().default(3)
    .describe('Maximum retry attempts'),
});
```

Pass it to `defineCli()`:

```typescript
const cli = defineCli({
  name: 'tasks',
  configSchema,
  // ...
});
```

### Config Resolution (6 Layers)

Configuration is resolved by merging 6 layers, from highest to lowest priority:

| Priority | Source | Example |
|----------|--------|---------|
| 1 (highest) | `--config` flag | `mycli --config ./custom.json cmd` |
| 2 | Environment variables | `TASKS_DEFAULT_PRIORITY=high` |
| 3 | Local config file | `{workdir}/.ph/tasks.config.local.json` |
| 4 | User config file | `~/.ph/tasks.config.user.json` |
| 5 | Implementation defaults | `configDefaults` in `defineCli()` |
| 6 (lowest) | Zod schema defaults | `.default('medium')` in schema |

### Environment Variable Naming

Env vars are derived from the CLI name and field name in UPPER_SNAKE_CASE:

| CLI name | Field | Env var |
|----------|-------|---------|
| `tasks` | `defaultPriority` | `TASKS_DEFAULT_PRIORITY` |
| `assist` | `apiKey` | `ASSIST_API_KEY` |
| `vetra` | `connectPort` | `VETRA_CONNECT_PORT` |

### Type-Safe Config Access

Use `InferConfig` to derive the TypeScript type from a config schema:

```typescript
import type { InferConfig } from 'ph-clint';

const configSchema = z.object({
  connectPort: z.number().default(3000),
  apiKey: z.string().optional(),
});

type Config = InferConfig<typeof configSchema>;
// Config = { connectPort: number; apiKey?: string }
```

The config is available in `CommandContext.config`, fully typed when using generic type parameters:

```typescript
const myCmd = defineCommand<typeof inputSchema, string, Config>({
  // ...
  execute: async (input, { config }) => {
    config.connectPort; // number
    config.apiKey;      // string | undefined
  },
});
```

### Secrets Schema

Use `secretsSchema` for sensitive config values (API keys, tokens). These values are merged into the config object but automatically censored in help output, `config` command display, and metadata:

```typescript
const cli = defineCli({
  name: 'assist',
  configSchema: z.object({
    model: z.string().default('anthropic/claude-haiku-4-5').describe('LLM model'),
  }),
  secretsSchema: z.object({
    apiKey: z.string().optional().describe('Anthropic API key'),
  }),
  // ...
});

// In commands, secrets are available on config like normal fields:
execute: async (input, { config }) => {
  config.apiKey;  // string | undefined — accessible in code
  config.model;   // string — normal config field
}
```

Secret fields are marked `sensitive: true` in CLI metadata and censored as `***` in `config` command output.

### Config Commands

When `configSchema` is present, a built-in `config` command is auto-registered:

- `mycli config` — Show current configuration
- `mycli config --set defaultPriority=high` — Set a config value
- `/config` in REPL — Same behavior interactively

---

## Workspace Persistence

The `WorkdirStore` provides file-based persistence rooted at `{workdir}/.ph/{cliName}/`:

```typescript
execute: async (input, { workspace }) => {
  // Load JSON (returns fallback if file doesn't exist)
  const tasks = await workspace.loadJsonObject<Task[]>('tasks.json', []);

  // Modify and save
  tasks.push(newTask);
  await workspace.storeJsonObject('tasks.json', tasks);

  // Get paths
  workspace.getWorkdir();                  // User's working directory
  workspace.getStoreFolder();              // {workdir}/.ph/{cliName}/
  workspace.getStoreFolder('custom/dir');  // {workdir}/.ph/{cliName}/custom/dir
  workspace.getLocalConfigPath();          // {workdir}/.ph/{cliName}.config.local.json
}
```

For testing, use the in-memory store:

```typescript
import { createMemoryWorkdirStore } from 'ph-clint';

const workspace = createMemoryWorkdirStore();
// Same API, no filesystem I/O
```

---

## Interactive Mode (REPL)

### Entering Interactive Mode

```bash
mycli -i
```

In the REPL:

- `/command --args` — Run a command
- `/help` — Show available commands
- `/exit` or Ctrl+D — Exit the REPL
- Bare text — Routed to the default subcommand (typically the agent, if configured)

### Welcome Message

```typescript
interactive: {
  welcome: 'My CLI — type /help for commands',
}
```

Or config-aware:

```typescript
interactive: {
  welcome: ({ config, workdir }) =>
    `My CLI (mode: ${config.mode})\nWorkdir: ${workdir}`,
}
```

### Auto-Completion

The REPL provides automatic completion for:

- **Command names**: `/gr` → Tab → `/greet`
- **Flag names**: `/add --` → Tab → `--title`, `--priority`, `--due`
- **Enum values**: `/list --filter d` → Tab → `done`

### Programmatic REPL (Testing)

For integration testing without spawning a subprocess:

```typescript
import { createReplSession, createMemoryWorkdirStore } from 'ph-clint';

const session = createReplSession({
  cli,
  context: {
    workdir: '/tmp/test',
    workspace: createMemoryWorkdirStore(),
    config: { defaultPriority: 'medium' },
    stdout: () => {},
  },
});

const result = await session.processInput('/greet --name World');
// result.text === 'Hello, World!'
// result.type === 'result'
```

### Headless REPL (RunOptions)

Feed input programmatically without Ink rendering:

```typescript
const inputs = ['/greet --name World', '/exit'];

async function* inputGenerator() {
  for (const line of inputs) yield line;
}

await cli.run(['node', 'cli.ts', '-i'], {
  interactiveInput: inputGenerator(),
  stdout: (msg) => console.log(msg),
});
```

---

## Triggers and Routine Loop

### Defining a Trigger

Triggers are polling-based condition checks that produce work items:

```typescript
import { defineTrigger } from 'ph-clint';

const fileChangeTrigger = defineTrigger({
  id: 'file-change',
  type: 'condition',
  setup: async (context) => {
    // Initialize trigger state (runs once when routine starts)
    context.state.lastModified = Date.now();
  },
  poll: async (context) => {
    // Called on every tick — return a WorkItem or null
    const current = await getLatestMtime(context.config.watchDir);

    if (current > context.state.lastModified) {
      context.state.lastModified = current;
      return {
        type: 'command',
        params: { commandId: 'build', args: {} },
        callbacks: {
          onSuccess: () => context.emit('build:complete'),
          onFailure: (err) => context.emit('build:failed', err),
        },
      };
    }
    return null;
  },
});
```

### TriggerContext

| Property | Description |
|----------|-------------|
| `context.config` | Resolved CLI config |
| `context.state` | Persistent per-trigger state (survives across polls) |
| `context.emit` | Emit events to the event bus |

### Work Items

A trigger returns `WorkItem | null`:

```typescript
interface WorkItem {
  type: 'command' | 'function';
  params: Record<string, unknown>;  // For 'command': { commandId, args }
  callbacks?: {
    onSuccess?: (result: unknown) => void;
    onFailure?: (error: Error) => void;
  };
}
```

### Registering Triggers and Configuring the Routine

```typescript
const cli = defineCli({
  name: 'watcher',
  commands: [build, watch, status],
  triggers: [fileChangeTrigger],
  routine: {
    tickInterval: 1000,   // Poll every 1 second (default: 2000)
    idleInterval: 500,    // Wait between empty polls (default: 500)
  },
});
```

### Controlling the Routine from Commands

```typescript
const watch = defineCommand({
  id: 'watch',
  description: 'Start watching for file changes',
  inputSchema: z.object({}),
  execute: async (_, { routine }) => {
    routine!.start();
    return { text: 'Watching for changes...' };
  },
});

const status = defineCommand({
  id: 'status',
  description: 'Show watcher status',
  inputSchema: z.object({}),
  execute: async (_, { routine, processes }) => {
    const running = processes!.list().filter(p => p.status === 'running');
    return {
      text: `Routine: ${routine!.status}\nRunning processes: ${running.length}`,
    };
  },
});
```

### Routine States

`init` → `ready` → `running` ↔ `stopping`

---

## Process Management

Run shell commands as bounded background processes:

```typescript
const build = defineCommand({
  id: 'build',
  description: 'Run the build command',
  inputSchema: z.object({}),
  execute: async (_, { config, processes }) => {
    const result = await processes!.run(config.buildCommand, {
      label: 'build',
      timeout: 60_000,  // 60 second timeout
    });
    return { text: result.success ? 'Build succeeded' : 'Build failed' };
  },
});
```

### ProcessManager API

```typescript
// Run a command, wait for completion
const result = await processes.run('npm run build', { label: 'build', timeout: 60_000 });
result.success;  // boolean
result.output;   // string (stdout + stderr)

// List running/completed processes
const handles = processes.list();
handles.forEach(h => {
  h.label;   // 'build'
  h.status;  // 'running' | 'succeeded' | 'failed'
  h.kill();  // Force-stop if running
});
```

---

## Service Management

Services are long-running background processes (dev servers, databases, etc.) with readiness detection, health checks, and lifecycle management.

### Defining a Service

```typescript
import { defineService, checkWorkdir, checkCommand, checkPort } from 'ph-clint';

const devServer = defineService<Config>({
  id: 'dev-server',
  label: 'Dev Server',

  // Command to start the service (static string or dynamic function)
  command: 'npm run dev',
  // Or dynamic:
  // command: (params) => `npm run dev -- --port ${params?.port ?? 3000}`,

  // Environment variables from config
  env: (config) => ({
    PORT: String(config.port),
    NODE_ENV: 'development',
  }),

  // Optional: Zod schema for runtime parameters
  paramsSchema: z.object({
    port: z.coerce.number().optional(),
  }),

  // Readiness detection — service is "ready" when all patterns match
  readiness: {
    // Single pattern:
    // pattern: /listening on port (\d+)/,
    // captures: { 'http': 1 },

    // Or multiple patterns (all must match):
    patterns: [
      {
        name: 'http-port',
        pattern: /Local:\s*http:\/\/localhost:(\d+)/,
        captures: { 'http': 1 },
      },
      {
        name: 'mcp-server',
        pattern: /MCP server available at (https?:\/\/[^\s]+)/,
        captures: {
          'mcp': { group: 1, type: 'api-mcp' },
        },
      },
    ],
    timeout: 30_000,
  },

  // Preflight checks (run before starting)
  preflight: [
    checkWorkdir(
      (cwd) => fs.existsSync(path.join(cwd, 'package.json')),
      'Not a Node.js project',
      'Run from a directory with package.json',
    ),
    checkCommand('node', { hint: 'Install Node.js' }),
    checkPort(3000, 'Dev server'),
  ],

  // Shutdown behavior
  shutdown: { signal: 'SIGTERM', timeout: 10_000 },

  // Auto-restart on failure
  restart: { enabled: true, maxRetries: 3, delay: 5_000 },

  // Max concurrent instances
  maxInstances: 1,

  // Project scanner — auto-discovers projects in a directory tree
  projectScanner: {
    isProjectFolder: (dir) => fs.existsSync(path.join(dir, 'powerhouse.config.ts')),
    getProjectName: (dir) => path.basename(dir),
    getProjectConfig: (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')),
  },
});
```

### Registering Services

```typescript
const cli = defineCli({
  name: 'mycli',
  commands: [init],
  services: [devServer],
});
```

This auto-registers service commands: `mycli dev-server --action up`, `--action down`, `--action restart`, and `mycli dev-server` for status. In the REPL: `/dev-server --action up`, etc.

### Service Events

Listen to service lifecycle events:

```typescript
const cli = defineCli({
  services: [devServer],
  events: {
    'service:pattern-matched': (event) => {
      console.log(`✓ ${event.name} matched (${event.remaining} remaining)`);
    },
    'service:ready': (event) => {
      console.log(`✓ ${event.label} is ready`);
      console.log('Endpoints:', event.endpoints);
    },
    'service:failed': (event) => {
      console.log(`✗ ${event.label} failed: ${event.error}`);
    },
    'service:restarting': (event) => {
      console.log(`↻ Restart attempt ${event.attempt}/${event.maxRetries}`);
    },
    'service:stopped': (event) => {
      console.log(`■ ${event.label} stopped`);
    },
  },
});
```

### Preflight Checks

Three built-in preflight check factories:

```typescript
// Check that the working directory meets a condition
checkWorkdir(
  (cwd) => fs.existsSync(path.join(cwd, 'package.json')),
  'Not a valid project directory',          // Error message
  'Run from a directory with package.json', // Hint
)

// Check that a command-line tool is available
checkCommand('docker', {
  hint: 'Install Docker: https://docs.docker.com/get-docker/',
  versionFlag: '--version',
  versionTest: (v) => parseInt(v) >= 20,
})

// Check that a port is free
checkPort(3000, 'Dev server')
```

### Readiness Detection with Endpoint Capture

Service readiness patterns can capture endpoints from stdout:

```typescript
readiness: {
  patterns: [
    {
      name: 'api',
      pattern: /API running at (https?:\/\/[^\s]+)/,
      captures: {
        'api-url': { group: 1, type: 'api-rest' },
      },
    },
  ],
  timeout: 30_000,
}
```

Endpoint types: `'api-mcp'`, `'api-rest'`, `'api-graphql'`, `'website'`, `'other'`

Captured endpoints are available via `ServiceManager.list()`:

```typescript
const instances = services.list('dev-server');
instances[0].endpoints;      // { 'api-url': 'http://localhost:3000' }
instances[0].endpointTypes;  // { 'api-url': 'api-rest' }
```

### ServiceManager API

```typescript
// Start a service (returns instance ID)
const instanceId = await services.start('dev-server', {
  workdir: '/path/to/project',
  params: { port: 3001 },
});

// Stop a service (all instances or specific one)
await services.stop('dev-server');
await services.stop('dev-server', instanceId);

// List instances
const instances = services.list('dev-server');

// Get logs
const recentLogs = services.logs('dev-server', instanceId, 50);

// Watch logs in real-time
const unwatch = services.watchLogs('dev-server', instanceId, (line) => {
  console.log(line);
});
// Later: unwatch() to stop

// Scan for projects using the service's projectScanner
const projects = services.scanProjects('dev-server', '/path/to/search');
// Returns: [{ name, path, config? }]

// Clean up stopped instance state files
services.purgeStoppedInstances('dev-server');
```

---

## AI Agent Integration (Mastra)

ph-clint supports optional AI agent integration via [Mastra](https://mastra.ai). The integration is fully lazy-loaded — Mastra is only imported when actually used.

### Setting Up an Agent

```typescript
import { defineCli } from 'ph-clint';

const cli = defineCli({
  name: 'assist',
  configSchema: z.object({
    apiKey: z.string().optional().describe('Anthropic API key'),
    model: z.string().default('anthropic/claude-haiku-4-5').describe('LLM model'),
  }),
  commands: [cmd1, cmd2],
  interactive: {
    welcome: ({ config }) => {
      const mode = config.apiKey ? `LLM: ${config.model}` : 'demo mode';
      return `Assistant (${mode})`;
    },
  },
});

cli.setAgentLoader(async (ctx) => {
  // Return a demo agent when no API key is set
  if (!ctx.config.apiKey) return createDemoAgent();

  // Lazy-load Mastra only when needed
  const { createMastraHelpers } = await import('ph-clint/mastra');
  const { Agent } = await import('@mastra/core/agent');
  const m = createMastraHelpers(ctx);

  return m.wrapAgent(new Agent({
    id: 'assistant',
    name: 'My Assistant',
    instructions: 'You are a helpful assistant.',
    model: ctx.config.model,
    tools: await m.getTools(),       // CLI commands as Mastra tools
    workspace: await m.createWorkspace(), // File I/O sandbox
    memory: await m.createMemory(),       // Thread-based LibSQL memory
  }));
});
```

### AgentContext

The agent loader receives an `AgentContext`:

```typescript
interface AgentContext<TConfig> {
  workdir: string;         // Working directory
  config: TConfig;         // Resolved config
  cliName: string;         // CLI name
  cliVersion: string;      // CLI version
  context: CommandContext;  // Full command context (services, processes, etc.)
  commands: Command[];     // All registered commands
  skills: SkillInfo[];     // Skills assigned to this agent (from SkillsConfig)
}
```

### MastraHelpers

`createMastraHelpers(ctx)` returns:

| Method | Description |
|--------|-------------|
| `getTools(options?)` | Converts CLI commands to Mastra tools. With `includeMcp: true` (default), also discovers MCP tools from running services. |
| `createWorkspace()` | Creates a Mastra Workspace with LocalFilesystem rooted at workdir. |
| `createMemory()` | Creates thread-based Memory backed by LibSQL at `{workspace}/.ph/{cliName}/.mastra/db/mastra.db`. |
| `wrapAgent(agent, options?)` | Wraps a Mastra Agent as an `AgentProvider` that yields `StreamChunk`s. `maxSteps` defaults to 30. |

### MCP Tool Discovery

When services with `api-mcp` endpoints are running, `getTools()` automatically discovers their MCP tools:

```typescript
// Requires MCPClient from @mastra/mcp
import { MCPClient } from '@mastra/mcp';

const tools = await m.getTools({ MCPClient });
// Contains both CLI command tools and MCP-discovered tools
// MCP tools are prefixed: '{serviceId}-mcp__toolName'
```

### Creating a Demo Agent

For testing or when no API key is available, implement the `AgentProvider` interface directly:

```typescript
import type { AgentProvider, StreamChunk } from 'ph-clint';

function createDemoAgent(): AgentProvider {
  return {
    id: 'demo',
    async *stream(prompt, opts) {
      // Yield streaming chunks
      yield { type: 'text-delta', text: `Echo: ${prompt}` } satisfies StreamChunk;
    },
  };
}
```

### Agent in the REPL

When an agent is configured, bare text in the REPL (not prefixed with `/`) is routed to the agent:

```
> What images do I have?              ← routed to agent
> /list-images                        ← runs command directly
> /help                               ← shows help
```

### Session Resumption

Resume a previous agent conversation via `--resume`:

```bash
mycli -i --resume thread_abc123
```

---

## Streaming Output

### StreamChunk Types

Agent output is delivered as a typed stream of chunks:

```typescript
type StreamChunk =
  | { type: 'text-delta'; text: string }       // Incremental text from the agent
  | { type: 'tool-call'; toolName: string; args: unknown }   // Agent calling a tool
  | { type: 'tool-result'; toolName: string; result: unknown; isError: boolean }  // Tool result
  | { type: 'error'; error: string }           // Error
```

### Formatting Utilities

```typescript
import { formatStreamChunk, renderStream } from 'ph-clint';

// Format a single chunk (with ANSI colors)
const formatted = formatStreamChunk(chunk);

// Transform a chunk stream to formatted strings
for await (const line of renderStream(agentStream)) {
  process.stdout.write(line);
}
```

---

## Events

### Event Bus

ph-clint uses a central event bus for decoupled communication:

```typescript
const cli = defineCli({
  events: {
    'service:ready': (data) => { /* ... */ },
    'build:complete': () => { /* ... */ },
    'custom:event': (data) => { /* ... */ },
  },
});
```

Events can be emitted from:

- Commands: `context.emit('my-event', data)`
- Triggers: `context.emit('build:complete')`
- Services: Automatic lifecycle events (`service:ready`, `service:failed`, etc.)

### Built-in Service Events

| Event | Payload |
|-------|---------|
| `service:pattern-matched` | `{ serviceId, name, remaining }` |
| `service:ready` | `{ serviceId, label, endpoints }` |
| `service:failed` | `{ serviceId, label, error }` |
| `service:restarting` | `{ serviceId, label, attempt, maxRetries }` |
| `service:stopped` | `{ serviceId, label }` |

---

## CLI Metadata

Every CLI exposes machine-readable metadata via `getMetadata()` and the `--meta` flag:

```bash
mycli --meta          # Outputs JSON metadata to stdout
```

```typescript
const meta = cli.getMetadata();
// Returns CliMetadata with:
//   name, version, description
//   hasInteractive, hasAgent, hasReactor
//   config — field metadata with env var names and sensitive flags
//   commands — with param metadata
//   services — with MCP prefix, shutdown, restart config
//   skills — sources, agent assignments, resolved skill info
```

The metadata is designed for build-time tooling (e.g., generating agent skill templates that reference CLI commands by name). Config fields from `secretsSchema` are marked `sensitive: true`. Service metadata includes `mcpPrefix` derived from readiness captures with `type: 'api-mcp'`.

---

## Handlebars Templates

ph-clint includes a Handlebars template engine for agent skill rendering with missing-variable detection:

```typescript
import { renderSkillTemplate } from 'ph-clint';

const { rendered, warnings } = renderSkillTemplate(
  'Hello {{name}}, you have {{count}} tasks. {{missing}}',
  { name: 'Alice', count: 5 },
);
// rendered: 'Hello Alice, you have 5 tasks. '
// warnings: ['Template references "{{missing}}" but context has no value for it']
```

### Built-in Helpers

Eight default helpers are registered automatically:

| Helper | Description |
|--------|-------------|
| `{{formatDate date "time"}}` | Format a date (formats: `time`, `date`, or ISO) |
| `{{join array ", "}}` | Join array with separator |
| `{{exists value}}` | True if value is not null/undefined/empty |
| `{{eq a b}}` | Strict equality check |
| `{{uppercase str}}` | Convert to uppercase |
| `{{lowercase str}}` | Convert to lowercase |
| `{{hasItems array}}` | True if array is non-empty |
| `{{default value fallback}}` | Use fallback when value is empty |

### Template Variable Extraction

```typescript
import { extractTemplateVars } from 'ph-clint';

const vars = extractTemplateVars('{{name}} uses {{#each tools}}{{this}}{{/each}}');
// Set { 'name', 'tools' }
```

---

## Conversation Logging

The Mastra integration includes an append-only markdown logger for agent conversations:

```typescript
import { MarkdownConversationLogger, loggedStream } from 'ph-clint/mastra';

const logger = new MarkdownConversationLogger({
  directory: '/path/to/logs',
});

// Start a session
logger.startSession('session-1', 'assistant', 'My Assistant', 'System prompt...');

// Wrap an agent stream to log all chunks automatically
const logged = loggedStream(agentStream, logger, 'session-1');
for await (const chunk of logged) {
  // chunks pass through unchanged, but are also logged
}

// End session (writes summary with duration and counts)
logger.endSession('session-1');
```

Log files are written as markdown at `{directory}/{agentName}/{YYYYMMDD_HHMM_NNN}.md` with full conversation transcripts including tool calls and results.

---

## Testing

ph-clint is designed for testability at every level, without mocks.

### Unit Testing Commands

Test `execute()` directly with a mock context:

```typescript
import { createMemoryWorkdirStore } from 'ph-clint';
import { add } from './commands/add.js';

test('add creates a task', async () => {
  const workspace = createMemoryWorkdirStore();
  const context = {
    workdir: '/tmp/test',
    workspace,
    config: { defaultPriority: 'medium' },
    stdout: () => {},
  };

  const result = await add.execute({ title: 'Test task' }, context);
  expect(result.text).toContain('Test task');

  const tasks = await workspace.loadJsonObject('tasks.json', []);
  expect(tasks).toHaveLength(1);
});
```

### Integration Testing the CLI

Use `cli.run()` with injected I/O — no subprocess needed:

```typescript
test('greet command via CLI', async () => {
  const output: string[] = [];
  await cli.run(['node', 'cli.ts', 'greet', '--name', 'World'], {
    stdout: (msg) => output.push(msg),
    exit: () => {},
  });
  expect(output.join('')).toContain('Hello, World!');
});
```

### Testing the REPL

Use `createReplSession()` for headless REPL testing:

```typescript
import { createReplSession, createMemoryWorkdirStore } from 'ph-clint';

test('REPL processes commands', async () => {
  const session = createReplSession({
    cli,
    context: {
      workdir: '/tmp',
      workspace: createMemoryWorkdirStore(),
      config: {},
      stdout: () => {},
    },
  });

  const result = await session.processInput('/greet --name World');
  expect(result.type).toBe('result');
  expect(result.text).toBe('Hello, World!');

  const exit = await session.processInput('/exit');
  expect(exit.type).toBe('exit');
});
```

### E2E Testing

Spawn a real subprocess for full end-to-end testing:

```typescript
import { execFile } from 'node:child_process';

test('CLI runs as subprocess', (done) => {
  execFile('npx', ['tsx', 'src/cli.ts', 'greet', '--name', 'World'], (err, stdout) => {
    expect(stdout).toContain('Hello, World!');
    done();
  });
});
```

### Test Runner

```bash
cd packages/ph-clint
pnpm test          # Runs all tests with coverage
```

Coverage target: 95% (statements, branches, functions, lines).

---

## API Reference

### Define Functions

| Function | Description |
|----------|-------------|
| `defineCommand(options)` | Define a command with Zod input schema and execute function |
| `defineCli(options)` | Define a CLI with commands, config, services, and integrations |
| `defineTrigger(options)` | Define a condition-based trigger for the routine loop |
| `defineService(options)` | Define a managed background service |

### Factory Functions

| Function | Description |
|----------|-------------|
| `createServiceManager(defs, opts)` | Create a service lifecycle manager |
| `createProcessManager()` | Create a bounded shell command executor |
| `createRoutine(options)` | Create a tick-based execution loop |
| `createEventBus()` | Create a central event emitter |
| `createLogger(level?, sink?)` | Create a structured logger |
| `createWorkdirStore(workdir, cliName)` | Create file-based workspace persistence |
| `createMemoryWorkdirStore()` | Create in-memory workspace (for testing) |
| `createReplSession(options)` | Create a testable REPL session |

### Built-in Command Factories

| Function | Description |
|----------|-------------|
| `createConfigCommand(options)` | Create the `config` command (auto-injected with `configSchema`) |
| `createHelpCommand(cli)` | Create the `cli-docs` help command |
| `createServiceCommands(defs, events)` | Create per-service management commands |

### Config Utilities

| Function | Description |
|----------|-------------|
| `resolveConfig(options)` | Merge 6-layer config and validate through Zod |
| `resolveWorkdir(options?)` | Resolve working directory (3-level precedence) |
| `configKeyToEnvVar(cliName, field)` | Derive env var name from CLI name + field |
| `toUpperSnake(str)` | Convert camelCase to UPPER_SNAKE_CASE |
| `localConfigPath(workdir, cliName)` | Path to local config file |
| `userConfigPath(cliName)` | Path to user-level config file |
| `userStoreFolder(cliName, ...sub)` | Path to user-level store directory |
| `getMissingRequiredFields(schema, config)` | Find required fields with no value |

### Schema & Formatting

| Function | Description |
|----------|-------------|
| `getSchemaFields(schema)` | Extract field metadata from a Zod object schema |
| `formatZodError(err, commandId?)` | Format Zod validation errors for display |
| `formatStreamChunk(chunk)` | Format a StreamChunk with ANSI colors |
| `renderStream(stream)` | Transform a chunk stream to formatted strings |
| `renderMarkdown(text)` | Render markdown to ANSI terminal output |

### Completion & Routing

| Function | Description |
|----------|-------------|
| `getCompletions(input, commands)` | Get completion candidates for REPL input |
| `getGhostSuggestion(input, commands)` | Get inline suggestion preview |
| `getCompletionSuffix(completion, input)` | Get suffix to append after completion |
| `applyCompletion(input, completion)` | Apply a completion to current input |
| `parseReplInput(input, commandIds, hasDefault?)` | Parse REPL input into structured form |
| `tokenizeArgs(argsStr)` | Tokenize argument string (respects quotes) |

### Preflight Checks

| Function | Description |
|----------|-------------|
| `checkWorkdir(test, message, hint?)` | Validate working directory condition |
| `checkCommand(binary, options?)` | Verify a CLI tool is installed |
| `checkPort(port, label?)` | Verify a port is available |
| `isPortFree(port)` | Check if a port is free (returns boolean) |

### Skills & Templates

| Function | Description |
|----------|-------------|
| `readSkillsFromSources(dirs)` | Scan directories for SKILL.md files |
| `installSkills(options)` | Copy skill folders into the workspace store |
| `createSkillCommands(skills)` | Create CLI commands from skill metadata |
| `isSkillInvocation(value)` | Type guard for `SkillInvocation` results |
| `renderSkillTemplate(template, context, opts?)` | Render a Handlebars template with default helpers |
| `extractTemplateVars(template)` | Extract referenced variable names from a template |
| `registerDefaultHelpers(hbs)` | Register the 8 standard helpers on a Handlebars instance |

### Project Scanner

| Function | Description |
|----------|-------------|
| `scanProjects(rootDir, scanner)` | Breadth-first search for project folders |
| `PROJECT_INDICATORS` | Array of common project indicator files (package.json, Cargo.toml, etc.) |

### Mastra Integration (`ph-clint/mastra`)

| Function | Description |
|----------|-------------|
| `createMastraHelpers(ctx)` | Create convenience helpers for Mastra agents |
| `commandsToMastraTools(cmds, ctx)` | Convert ph-clint commands to Mastra tools |
| `mapMastraStream(fullStream)` | Map Mastra Agent stream to StreamChunks |
| `getMastraPaths(store, options?)` | Compute Mastra paths (DB, workspace, skills) |
| `discoverMcpTools(services, log?, MCPClient?)` | Discover MCP tools from running services |
| `disconnectAllMcp()` | Disconnect all cached MCP clients |
| `MarkdownConversationLogger` | Append-only markdown logger for agent conversations |
| `loggedStream(stream, logger, sessionId)` | Wrap an agent stream to log all chunks |

### Key Types

| Type | Description |
|------|-------------|
| `Command<TInput, TOutput, TConfig>` | Command definition |
| `Cli` | CLI instance with run/execute/help methods |
| `CliOptions<TSchema>` | Options for `defineCli()` |
| `RunOptions` | Options for `cli.run()` (stdout/stderr/exit injection) |
| `CommandContext<TConfig>` | Execution context passed to commands |
| `WorkdirStore` | Workspace persistence API |
| `InferConfig<TSchema>` | Derive TypeScript type from Zod config schema |
| `StreamChunk` | Union of text-delta, tool-call, tool-result, error chunks |
| `AgentProvider` | Interface for agent implementations (`id` + `stream()`) |
| `AgentContext<TConfig>` | Context passed to agent loaders |
| `AgentLoader<TConfig>` | Type for the agent factory function |
| `Trigger` | Trigger definition (poll-based) |
| `TriggerContext` | Context passed to trigger poll/setup |
| `WorkItem` | Work item produced by triggers |
| `Routine` | Routine loop controller |
| `RoutineConfig` | Routine timing configuration |
| `ServiceDefinition<TConfig>` | Service definition |
| `ServiceManager` | Service lifecycle manager |
| `ServiceInstanceStatus` | Status of a service instance |
| `ReadinessConfig` | Service readiness detection config |
| `ReadinessPattern` | Named readiness pattern with captures |
| `CaptureDefinition` | Typed endpoint capture from readiness pattern |
| `EndpointType` | `'api-mcp' \| 'api-rest' \| 'api-graphql' \| 'website' \| 'other'` |
| `PreflightCheck<TConfig>` | Preflight validation function |
| `PreflightResult` | `{ ok: true } \| { ok: false; message; hint? }` |
| `EventBus` | Central event emitter (emit/on/off) |
| `ProcessManager` | Bounded shell command executor |
| `ProcessHandle` | Handle to a running/completed process |
| `Logger` | Structured logger (debug/info/warn/error) |
| `LogLevel` | `'debug' \| 'info' \| 'warn' \| 'error'` |
| `Resolvable<T, TConfig>` | Static value or config-dependent function |
| `Integration` | Plugin interface (id, setup, teardown) |
| `ReplSession` | REPL session (processInput, completions) |
| `ReplOutput` | REPL command result (text, type, panelId?) |
| `PromptConfig` | Parameter prompting configuration |
| `FieldInfo` | Zod schema field metadata |
| `SkillInfo` | Agent skill metadata (name, description) |
| `SkillsConfig` | Skills configuration (sources, agent assignments) |
| `SkillInvocation` | Result of a skill command (routes to agent) |
| `CliMetadata` | JSON-serializable CLI metadata (from `getMetadata()`) |
| `MetadataField` | Field metadata in CLI metadata output |
| `ConfigMetadataField` | Config field metadata with env var name |
| `ProjectScanner` | Pluggable project detection interface |
| `ProjectScanResult` | Result of project scanning (`{ name, path, config? }`) |
| `RenderOptions` | Options for `renderSkillTemplate()` |
| `RenderResult` | Result of template rendering (`{ rendered, warnings }`) |
| `IConversationLogger` | Interface for agent conversation loggers |
