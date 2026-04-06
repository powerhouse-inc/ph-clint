# ph-clint — Next Steps

Implementation plan: build the library to make the examples work, in order.

## 1. Bootstrap `packages/ph-clint/`

Create `package.json`, `tsconfig.json`, and the initial module structure (`src/core/`, `src/cli/`, `src/output/`, `src/index.ts`). Set up the build with `tsup` and dev runner with `tsx`.

## 2. Implement core for Example 01 (Hello World)

The minimum to make `01-hello-world` pass its 6 acceptance criteria:

- `defineCommand()` — takes Zod input schema + execute function
- `defineCli()` — takes name/version/description/commands, returns object with `.run(argv)`
- Zod schema → Commander.js arg parsing (string/boolean/number, defaults, required)
- Auto-generated `--help` derived from Zod `.describe()` calls
- Shell completion generation
- Wire up the example's tests (Jest config already exists)

## 3. Implement core for Example 02 (Task Tracker)

Adds:

- Interactive REPL mode (Ink + React)
- Workspace and 5-layer config resolution
- Parameter prompting for missing required args
- Multiple commands with shared state

## 4. Example 03 (File Watcher)

Routine loop, condition triggers, background processes, `--wait` flag.

## 5. Example 04 (Chat Assistant)

Mastra agent integration, streaming, conversation memory.

## 6. Examples 05–08

Progressively add ServiceExecutor, Powerhouse reactor, combined integrations, and full multi-agent reference.
