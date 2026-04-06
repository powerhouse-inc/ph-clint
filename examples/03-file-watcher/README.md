# 03 — File Watcher

A non-agentic CLI that uses the routine loop to watch a directory for changes and trigger build commands. Demonstrates triggers, background processes, and the event bus — all without any AI/agent involvement.

## What It Shows

- Routine loop with a condition trigger (no agent)
- Background process management (build commands)
- Event bus: process completion events displayed in REPL
- `--wait` mode in command mode (stays alive, watches, exits on signal)
- Work items of type `command` and `function`
- Escape to interrupt a running build

## Code

### Trigger definition

```typescript
import { defineCli, defineCommand, defineTrigger } from 'ph-clint';
import { z } from 'zod';
import { stat } from 'node:fs/promises';

const configSchema = z.object({
  watchDir: z.string().default('./src').describe('Directory to watch'),
  buildCommand: z.string().default('npm run build').describe('Build command to execute'),
});

// Condition trigger: polls the filesystem for changes
const fileChangeTrigger = defineTrigger({
  id: 'file-change',
  type: 'condition',
  setup: async (context) => {
    context.state.lastModified = Date.now();
  },
  poll: async (context) => {
    const { watchDir, buildCommand } = context.config;
    const current = await getLatestMtime(watchDir);

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

### Commands

```typescript
const build = defineCommand({
  id: 'build',
  description: 'Run the build command',
  inputSchema: z.object({}),
  execute: async (_, { config, processes }) => {
    const result = await processes.run(config.buildCommand, {
      label: 'build',
      timeout: 60_000,
    });
    return { text: result.success ? 'Build succeeded' : 'Build failed' };
  },
});

const watch = defineCommand({
  id: 'watch',
  description: 'Start watching for file changes',
  inputSchema: z.object({}),
  execute: async (_, { routine }) => {
    routine.start();
    return { text: 'Watching for changes...' };
  },
});

const status = defineCommand({
  id: 'status',
  description: 'Show watcher and build status',
  inputSchema: z.object({}),
  execute: async (_, { routine, processes }) => {
    const running = processes.list().filter(p => p.status === 'running');
    return {
      text: [
        `Routine: ${routine.status}`,
        `Running processes: ${running.length}`,
      ].join('\n'),
    };
  },
});
```

### CLI entry point

```typescript
const cli = defineCli({
  name: 'watcher',
  version: '1.0.0',
  configSchema,
  commands: [build, watch, status],
  triggers: [fileChangeTrigger],
  routine: {
    tickInterval: 1000,   // check every second
    idleInterval: 500,
  },
  interactive: {
    welcome: 'File Watcher — /watch to start, /status to check',
  },
});
```

### Usage

```bash
# Command mode with --wait: watches until Ctrl+C
watcher watch --wait

# Interactive mode
watcher -i
> /watch
# Watching for changes...
# (edit a file in ./src)
# → Build succeeded
> /status
# Routine: running
# Running processes: 0
> /build        # manual trigger
```

## Acceptance Criteria

- [ ] `watcher watch --wait` starts the loop, stays alive, rebuilds on file changes
- [ ] `watcher -i` + `/watch` starts watching in interactive mode
- [ ] File change in `watchDir` triggers a build within one tick interval
- [ ] Build output is captured and displayed
- [ ] Build failure triggers `build:failed` event (visible in REPL)
- [ ] Escape interrupts a running build, REPL stays alive
- [ ] `/status` shows routine and process state
- [ ] `WATCHER_WATCH_DIR=./lib watcher watch --wait` overrides the watch directory
- [ ] `--wait` mode exits cleanly on SIGINT/SIGTERM
