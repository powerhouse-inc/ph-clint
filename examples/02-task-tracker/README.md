# 02 — Task Tracker

A REPL-based task tracker with workspace persistence, interactive parameter prompting, and multiple commands. No agent — purely command-driven. Demonstrates the interactive mode, workspace, and the Zod-to-prompt pipeline.

## What It Shows

- Interactive mode with `/command` syntax
- Workspace persistence (tasks survive across sessions)
- Interactive parameter prompting for missing arguments
- Multiple commands with different schemas
- Command mode and interactive mode using the same definitions
- Auto-completion for commands and arguments

## Code

### Configuration with Zod schema

```typescript
import { defineCli, defineCommand, defineConfig } from 'ph-clint';
import { z } from 'zod';

const configSchema = z.object({
  defaultPriority: z.enum(['low', 'medium', 'high']).default('medium'),
});

const cli = defineCli({
  name: 'tasks',
  version: '1.0.0',
  description: 'A simple task tracker',
  configSchema,
  commands: [add, list, done, remove],
  interactive: {
    welcome: 'Task Tracker — type /help for commands',
  },
});
```

### Commands

```typescript
const add = defineCommand({
  id: 'add',
  description: 'Add a new task',
  inputSchema: z.object({
    title: z.string().describe('Task title'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
    due: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  }),
  prompt: {
    promptForDefaults: false,
    promptOptional: ['priority'],  // ask for priority interactively
  },
  execute: async ({ title, priority }, { workspace, config }) => {
    const tasks = await workspace.read('tasks.json', []);
    const task = {
      id: crypto.randomUUID(),
      title,
      priority: priority ?? config.defaultPriority,
      due: due ?? null,
      done: false,
    };
    tasks.push(task);
    await workspace.write('tasks.json', tasks);
    return { text: `Added: ${task.title} [${task.priority}]`, data: task };
  },
});

const list = defineCommand({
  id: 'list',
  description: 'List all tasks',
  inputSchema: z.object({
    filter: z.enum(['all', 'open', 'done']).default('open').describe('Filter tasks'),
  }),
  execute: async ({ filter }, { workspace }) => {
    const tasks = await workspace.read('tasks.json', []);
    const filtered = filter === 'all' ? tasks
      : tasks.filter(t => filter === 'done' ? t.done : !t.done);
    return {
      text: filtered.map(t => `${t.done ? '[x]' : '[ ]'} ${t.title} (${t.priority})`).join('\n'),
      data: filtered,
    };
  },
});

const done = defineCommand({
  id: 'done',
  description: 'Mark a task as completed',
  inputSchema: z.object({
    title: z.string().describe('Task title (partial match)'),
  }),
  execute: async ({ title }, { workspace }) => {
    const tasks = await workspace.read('tasks.json', []);
    const task = tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()));
    if (!task) return { text: `No task matching "${title}"` };
    task.done = true;
    await workspace.write('tasks.json', tasks);
    return { text: `Completed: ${task.title}` };
  },
});
```

### Usage

```bash
# Command mode
tasks add --title "Write tests" --priority high
tasks list
tasks done --title "tests"

# Interactive mode
tasks -i
> /add --title "Write tests"
# → framework prompts: "Priority? (low/medium/high) [medium]:"
> /list
> /done --title tests
> /help
```

### Workspace

```
.ph/cli/tasks/
├── settings.json    # { "defaultPriority": "medium" }
└── tasks.json       # Persisted task list
```

## Acceptance Criteria

- [ ] `tasks add --title "X"` creates a task persisted to workspace
- [ ] `tasks list` shows open tasks
- [ ] `tasks -i` launches REPL with welcome message
- [ ] `/add --title "X"` in REPL prompts for priority interactively
- [ ] `/add --title "X" --priority high` in REPL skips the prompt
- [ ] Tasks persist across CLI invocations (workspace file)
- [ ] Settings resolve: ENV > .env > local workspace > global workspace > defaults
- [ ] `TASKS_DEFAULT_PRIORITY=high tasks add --title "X"` uses high priority
- [ ] Auto-completion works for command names and `--filter` enum values
