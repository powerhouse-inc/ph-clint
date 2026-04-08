# Argument Processing: Framework Flags vs Subcommand Options

## The Problem

ph-clint has two levels of command-line options:

1. **Framework flags** — consumed by the CLI framework before any command runs. These set up the runtime context (working directory, config file, session resume, interactive mode).
2. **Subcommand options** — consumed by individual commands. These are defined by each command's Zod input schema.

These two levels can share option names. The canonical example is `--workdir`:

```
rupert --workdir my-workspace vetra-start --workdir my-project
       ^^^^^^^^                           ^^^^^^^^
       framework: sets the CLI workspace  subcommand: sets service cwd
```

The framework `--workdir` determines where `.ph/` state lives. The subcommand `--workdir` tells the service process where to run. They are independent concerns that happen to share a name.

## The Wrong Approach: Manual Argv Stripping

An earlier implementation manually pre-processed `argv` to extract and **strip** framework flags before passing the remainder to Commander:

```typescript
// DON'T DO THIS
const frameworkFlags = ['--resume', '--workdir', '-w', '--config', '-c'];
const filtered: string[] = [];
for (let i = 0; i < argv.length; i++) {
  if (frameworkFlags.includes(argv[i]!) && i + 1 < argv.length) {
    i++; // skip the flag and its value
  } else {
    filtered.push(argv[i]!);
  }
}
await program.parseAsync(filtered);
```

This caused multiple bugs:

- **Greedy stripping**: Every `--workdir` in the entire argv was consumed, regardless of position. A subcommand's `--workdir` was silently eaten.
- **Duplicate logic**: Framework flags were extracted in one place, stripped in another, and `--resume` was extracted in yet another. Three passes over argv for one concern.
- **Fragile boundary detection**: When stripping was scoped to "pre-subcommand" args, the code had to manually find the subcommand boundary — duplicating logic that Commander already has.
- **Shorthand collisions**: `-w` is the shorthand for both the framework `--workdir` and the config command's `--write`. Stripping `-w` globally broke config writes.

## The Right Approach: Let Commander Handle Scoping

Commander.js natively supports program-level vs subcommand-level option separation via `enablePositionalOptions()`:

```typescript
const program = new Commander();
program
  .enablePositionalOptions()  // <-- this is the key
  .option('-w, --workdir <path>', 'Set the workspace directory')
  .option('--resume <thread-id>', 'Resume a previous conversation');

// Subcommand defines its own --workdir independently
const sub = program.command('vetra-start');
sub.option('--workdir <path>', 'Working directory for the service');
```

With `enablePositionalOptions()` enabled:
- Options **before** the subcommand name are parsed as program-level options
- Options **after** the subcommand name are parsed as subcommand options
- The same option name can exist at both levels without conflict
- Commander handles the boundary detection internally

### Why not let Commander handle everything?

There is a chicken-and-egg problem: Commander subcommand actions need a fully initialized `CommandContext` (resolved workdir, loaded config, service manager, agent provider). But the context depends on `--workdir` and `--config` values, which are in the argv that Commander hasn't parsed yet.

The timeline looks like this:

```
1. Parse argv           → need --workdir, --config values
2. Resolve workdir      → depends on (1)
3. Load config          → depends on (2)
4. Create ServiceManager → depends on (2), (3)
5. Build CommandContext  → depends on (2), (3), (4)
6. Build Commander program → needs context for subcommand actions
7. Commander.parseAsync(argv) → executes subcommand with context from (5)
```

Commander can't help with steps 1-5 because it hasn't run yet. We need the flag values **before** Commander parses. This is the **look-ahead**: a lightweight pre-scan of the pre-command args to extract framework flag values, without consuming or modifying argv.

The look-ahead is intentionally minimal:
- It only reads values. It doesn't validate, error, or modify argv.
- It only scans args before the subcommand name. Post-subcommand args are untouched.
- It finds the subcommand boundary by checking against the known command names (`commandMap.keys()`). This is the same set Commander will use, so the boundary is consistent.

After the look-ahead, Commander takes over with the full, unmodified argv and does the real parsing, validation, help generation, and error handling. The look-ahead values are used only for context setup.

### What ph-clint does

The framework **extracts** framework flag values from pre-command args (needed to set up context before Commander runs), but does **not strip** them from argv. Commander receives the original, unmodified argv.

```typescript
// Extract framework flag values from pre-subcommand args
const userArgs = argv.slice(2);
const subcommandIdx = userArgs.findIndex((a) => subcommandNames.has(a));
const preCommandArgs = userArgs.slice(0, subcommandIdx === -1 ? userArgs.length : subcommandIdx);

let workdirFlag: string | undefined;
let configFileFlag: string | undefined;
let resumeId: string | undefined;
let interactiveFlag = false;

for (let i = 0; i < preCommandArgs.length; i++) {
  const arg = preCommandArgs[i]!;
  if (arg === '-i' || arg === '--interactive') {
    interactiveFlag = true;
  } else if (frameworkFlags.has(arg) && i + 1 < preCommandArgs.length) {
    const value = preCommandArgs[i + 1]!;
    if (arg === '--workdir' || arg === '-w') workdirFlag = value;
    else if (arg === '--config' || arg === '-c') configFileFlag = value;
    else if (arg === '--resume') resumeId = value;
    i++;
  }
}

// ... use workdirFlag/configFileFlag/resumeId to set up context ...

// Pass original argv to Commander — it handles scoping natively
await program.parseAsync(argv);
```

This is done in **one place, one pass** — no duplicate extraction, no stripping, no reconstructing argv.

## The Double-Workdir Example

This is the litmus test for correct argument processing:

```
rupert --workdir cli-test vetra-start --workdir invoicing
```

### What happens

1. **Pre-processing** extracts `workdirFlag = 'cli-test'` from the pre-subcommand args.

2. **Context setup** resolves the CLI workspace:
   - `context.workdir` = `/abs/path/to/cli-test` (absolute)
   - State files live at `cli-test/.ph/vetra-mastra/`

3. **Commander** parses the full argv with `enablePositionalOptions()`:
   - Program-level: `--workdir cli-test` is consumed by the program (Commander handles it, value is ignored since we already extracted it)
   - Subcommand-level: `vetra-start --workdir invoicing` routes to the start command, which receives `{ workdir: 'invoicing' }` in its parsed options

4. **Service start command** resolves the subcommand workdir relative to the CLI workdir:
   ```typescript
   const resolvedWorkdir = path.resolve(context.workdir, input.workdir);
   // => /abs/path/to/cli-test/invoicing
   ```

5. **Service spawns** in `cli-test/invoicing/` with instance ID `vetra:40ae5519` (hash of resolved path).

6. **State files** are stored centrally at `cli-test/.ph/vetra-mastra/services/vetra/vetra:40ae5519.json` — under the CLI workspace, not the service workdir.

### The result

```
State:   cli-test/.ph/vetra-mastra/services/vetra/vetra:40ae5519.json
Logs:    cli-test/.ph/vetra-mastra/services/vetra/vetra:40ae5519.log
Process: running with cwd = cli-test/invoicing/
```

## Design Rules

1. **Extract, don't strip.** Read framework flag values from pre-command args, but pass argv through to Commander unmodified.

2. **One pass, one place.** All pre-command flag extraction happens in a single loop at the top of `runImpl()`. No duplicate extraction elsewhere.

3. **Commander owns the boundary.** Don't manually detect where the subcommand starts for the purpose of routing — `enablePositionalOptions()` handles that. The manual subcommand index is only used to scope which args the framework reads its own flags from.

4. **Subcommand options are opaque to the framework.** The framework must never inspect, consume, or modify args that appear after the subcommand name. Those belong to the command's Zod schema and Commander's subcommand parser.

5. **Resolve relative paths at the command level.** Subcommand workdir values are relative to `context.workdir`. The command's execute function resolves them to absolute paths before passing to lower-level APIs (e.g., `services.start()`). The service manager receives absolute paths only.

## Commander Configuration Reference

The relevant Commander methods used by ph-clint:

| Method | Purpose |
|--------|---------|
| `enablePositionalOptions()` | Program options are only recognized before the subcommand. Subcommand options are scoped to after the subcommand name. **Required for same-name options at both levels.** |
| `exitOverride()` | Throws instead of calling `process.exit()`, enabling testability. |
| `configureOutput()` | Redirects Commander's output through the injected `stdout`/`stderr` callbacks. |
| `passThroughOptions()` | (Not currently used.) Would cause unrecognized subcommand options to be passed through as positional args instead of erroring. Useful for wrapping external tools. |

## Historical Context

This design was established after a debugging session where `vetra-start --workdir invoicing` silently failed because the framework consumed both `--workdir` flags. The service process spawned in the wrong directory (the CLI's cwd instead of the invoicing project) and exited before becoming ready. The fix was to stop stripping argv and rely on Commander's native `enablePositionalOptions()` scoping, which had been enabled from the start but was being bypassed by the manual stripping logic.
