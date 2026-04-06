# 01 — Hello World

The simplest possible ph-clint CLI. One command, command mode only, no workspace, no agent, no integrations. Demonstrates the core command definition pattern and how Zod schemas drive CLI argument parsing and help generation.

## What It Shows

- Defining a command with a Zod input schema
- Command mode execution (`mycli greet --name Alice`)
- Auto-generated `--help` from the schema
- Shell auto-completion setup

## Code

### Command definition

```typescript
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
```

### CLI entry point

```typescript
const cli = defineCli({
  name: 'hello',
  version: '1.0.0',
  description: 'A minimal ph-clint example',
  commands: [greet],
});

cli.run(process.argv);
```

### Usage

```bash
# Command mode
hello greet --name Alice
# → Hello, Alice!

hello greet --name Alice --loud
# → HELLO, ALICE!

# Auto-generated help
hello --help
hello greet --help
```

## Acceptance Criteria

- [ ] `hello greet --name Alice` prints `Hello, Alice!`
- [ ] `hello greet --name Alice --loud` prints `HELLO, ALICE!`
- [ ] `hello greet` (missing required `--name`) prints an error with usage help
- [ ] `hello --help` lists the `greet` command with its description
- [ ] `hello greet --help` lists `--name` and `--loud` with descriptions and defaults
- [ ] Shell completion script can be generated
