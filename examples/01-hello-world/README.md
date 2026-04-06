# 01 — Hello World

The simplest possible ph-clint CLI. One command, no workspace, no agent, no integrations. Demonstrates the core command definition pattern, interactive mode, and how Zod schemas drive CLI argument parsing, help generation, and REPL auto-completion.

## What It Shows

- Defining a command with a Zod input schema
- Command mode execution (`mycli greet --name Alice`)
- Interactive mode with `/command` syntax and auto-completion
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
  interactive: {
    welcome: 'Hello World CLI — type /help for commands',
  },
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

# Interactive mode
hello -i
> /greet --name Alice
# → Hello, Alice!
> /help
# → Available commands:
# →   /greet           Greet someone by name
# →   /help            Show this help
# →   /exit            Exit the REPL

# Auto-generated help
hello --help
hello greet --help
```

## How to Test

```bash
# Run the test suite
pnpm test

# Build
pnpm build

# Basic greeting
node dist/cli.js greet --name Alice
# → Hello, Alice!

# Loud mode
node dist/cli.js greet --name Alice --loud
# → HELLO, ALICE!

# Missing required argument — shows error + usage
node dist/cli.js greet
# → error: required option '--name <value>' not specified

# Top-level help — lists commands and -i option
node dist/cli.js --help
# → Usage: hello [options] [command]
# →   -i, --interactive  Start interactive REPL mode
# →   greet  Greet someone by name
# →   help   display help for command

# Command-level help — lists options with descriptions and defaults
node dist/cli.js greet --help
# → Usage: hello greet [options]
# →   --name <value>  Name of the person to greet
# →   --loud          Shout the greeting (default: false)
```

## Acceptance Criteria

- [ ] `hello greet --name Alice` prints `Hello, Alice!`
- [ ] `hello greet --name Alice --loud` prints `HELLO, ALICE!`
- [ ] `hello greet` (missing required `--name`) prints an error with usage help
- [ ] `hello --help` lists the `greet` command with its description
- [ ] `hello greet --help` lists `--name` and `--loud` with descriptions and defaults
- [ ] Shell completion script can be generated
- [ ] `hello -i` launches REPL with welcome message
- [ ] `/greet --name Alice` in REPL returns greeting
- [ ] `/help` in REPL lists available commands
- [ ] Tab auto-completes `/gr` to `/greet`
