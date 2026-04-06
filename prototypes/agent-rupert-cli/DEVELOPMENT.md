# Development Guide

This document is for developers extending the template, not end-users of the CLI.

## Scripts

```bash
pnpm dev <cmd>         # Run CLI via tsx (no build needed)
pnpm dev:mcp           # Run MCP HTTP server via tsx
pnpm dev:mcp:https     # Run MCP HTTPS server via tsx
pnpm dev:mcp:stdio     # Run MCP stdio server via tsx
pnpm build             # Compile CLI + MCP HTTP server to dist/
pnpm build:mcp         # Bundle MCP stdio server to dist/mcp/
pnpm start <cmd>       # Run compiled CLI
pnpm start:mcp         # Run compiled MCP HTTP server
pnpm start:mcp:https   # Run compiled MCP HTTPS server
pnpm start:mcp:stdio   # Run compiled MCP stdio server
pnpm mastra:dev        # Start Mastra Studio at localhost:4111
pnpm mastra:build      # Build Mastra production server
pnpm mastra:start      # Start Mastra production server
```

When using `pnpm dev` or `pnpm start`, do **not** add `--` before arguments — pnpm injects its own separator that breaks option flags.

## Architecture

The CLI has three consumption modes that share the same Mastra agents and tools:

```
src/
  cli.ts                    ← CLI entry point (Commander.js)
  commands/                 ← CLI commands (Ink + React)
  components/               ← Shared Ink components (e.g. Markdown renderer)
  mastra/
    index.ts                ← Mastra instance (agents, tools, workflows, scorers)
    agents/                 ← Agent definitions
    tools/                  ← Tool definitions
    workflows/              ← Workflow definitions
    scorers/                ← Scorer definitions
    server.ts               ← MCP HTTP/HTTPS server
    stdio.ts                ← MCP stdio server
```

The build uses `tsc` for the main CLI and MCP HTTP server, and `tsup` for the MCP stdio bundle (which needs a single-file output with shebang).

## Lazy-loading agent dependencies

Mastra and its transitive dependencies are heavy. To keep basic commands fast, **agent commands must lazy-load the Mastra instance** using dynamic `import()` instead of static imports.

A basic command like `hello` loads in ~0.3s. With a static Mastra import, that becomes ~0.8s — nearly 3x slower for a command that doesn't use an agent at all.

### Pattern

```tsx
// DON'T — static import loads Mastra on every CLI invocation
import { mastra } from '../mastra/index.js';

// DO — dynamic import loads Mastra only when this command runs
async function getAgent() {
  const { mastra } = await import('../mastra/index.js');
  return mastra.getAgentById('my-agent');
}
```

Use the `getAgent()` helper inside your React component effects or action handlers — not at the module level. See `src/commands/weather.tsx` for a complete example.

### When to use which

| Command type | Import style | Example |
|---|---|---|
| Basic (no agent) | Static imports only | `hello` |
| Agent-backed | Dynamic `import()` for Mastra | `weather` |

## Adding a new command

1. Create `src/commands/my-command.tsx`
2. Export a `registerMyCommand(program: Command)` function
3. Register it in `src/cli.ts`
4. If the command uses an agent, follow the lazy-loading pattern above
5. Register any new agents/tools in `src/mastra/index.ts`

## Publishing

```bash
pnpm build             # CLI + MCP HTTP server
pnpm build:mcp         # MCP stdio server (only if publishing the stdio binary)
npm publish --access public
```

## Mastra Studio

For visual debugging and testing of agents, tools, and workflows:

```bash
pnpm mastra:dev
```

Opens at http://localhost:4111.
