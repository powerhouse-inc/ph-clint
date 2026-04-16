# ph-clint-tpl-cli

Template for the **ph-clint CLI side** of an implementation project. Starts
as a flat layout (no Powerhouse reactor-package alongside it). When the
`powerhouse` feature gets toggled on, the generator performs a one-time
migration that moves this tree into `{name}-cli/` and scaffolds a sibling
`{name}-app/`.

## Folder layout

```
cli/
├── src/
│   ├── main.ts          # bin entrypoint (cli.run(process.argv))
│   ├── cli.ts           # defineCli(...) call with @clint markers
│   ├── config.ts        # configSchema + secretsSchema
│   ├── mastra/          # Mastra Studio entry (populated when Mastra is on)
│   ├── agents/          # Mastra agent definitions
│   ├── commands/        # defineCommand(...) definitions
│   ├── services/        # defineService(...) definitions
│   └── triggers/        # defineTrigger(...) definitions
├── prompts/             # Handlebars source for agent profiles & skills
│   ├── agent-profiles/  # AgentBase.md + specialized profiles
│   ├── skills-tpl/      # skill templates (authored here)
│   └── skills-ext/      # external/pre-built skills (dropped in as-is)
├── scripts/
│   └── build-skills.ts  # compiles prompts/ → gen/ via ph-clint-dev
├── gen/                 # codegen output (gitignored; built at build:skills)
└── tests/               # user-authored tests
```

## Feature toggles

Three independently togglable features. Each one is a `@clint:begin {name}`
/ `@clint:end {name}` region that `ts-morph` can rewrite:

### `powerhouse`

Enables the Powerhouse Reactor stack (Reactor, optional Switchboard,
optional Connect). On first enablement, the generator performs a one-time
migration:

1. Moves every file from `{root}/` to `{root}/{name}-cli/`.
2. Runs `ph init` inside `{root}/{name}-app/` to scaffold the standard
   Powerhouse reactor-package layout.
3. Writes a new root `package.json` with passthrough scripts (no pnpm
   workspaces — they interfere with `{name}-app`'s own builds).

### `mastra`

Enables the Mastra AI agent stack — agent definitions, thread-based memory
(LibSQL), optional MCP client, and the Mastra Studio entry point at
`src/mastra/index.ts` so `mastra dev` / `mastra build` / `mastra start` work.

### `routine`

Enables the tick-based routine loop and trigger registration. Forced on
when `mastra` is enabled (an agent without a routine can still run from the
REPL, but most useful setups want the loop).

## Codegen markers

Regions the generator can rewrite look like:

```ts
// src/cli.ts
export const cli = defineCli({
  // @clint:begin commands
  commands: [/* list injected by codegen */],
  // @clint:end commands

  // @clint:begin services
  services: [/* list injected by codegen */],
  // @clint:end services
});
```

Everything *outside* the markers is user-editable and preserved across
regenerations. Everything *inside* a `@clint:begin`/`@clint:end` pair is
codegen-owned.

Files under `gen/` are fully codegen-owned — wiped and rewritten on every
`build:skills`. Everything in `src/` is human-owned except for the
explicitly marked regions.
