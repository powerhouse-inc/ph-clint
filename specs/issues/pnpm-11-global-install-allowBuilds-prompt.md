# pnpm 11: Global Install Issues

## Problem

pnpm 11 introduced strict build-script security: packages with `postinstall` scripts must be explicitly approved before they can run. In a workspace, this is configured via `allowBuilds` in `pnpm-workspace.yaml`. But for **global installs** (`pnpm add -g`), there is no workspace — pnpm falls back to an interactive prompt.

When a user installs ph-clint-cli globally:

```
$ pnpm add -g @powerhousedao/ph-clint-cli@0.1.0-dev.62

? Choose which packages to build (Press <space> to select, <a> to toggle all, <i> to invert selection)
❯ ○ @apollo/protobufjs
  ○ @sentry/cli
  ○ esbuild
  ○ protobufjs

? The next packages will now be built: @apollo/protobufjs, @sentry/cli, esbuild, protobufjs.
Do you approve? (y/N)
```

The user must select all packages (press `a`), confirm (press Enter), then approve the build (press `y`). This is confusing for non-technical users and adds friction to onboarding.

This affects **any** globally installed package with native dependencies — it's not specific to ph-clint. The same prompt appears for tools like Vite, Turbo, Angular CLI, etc. when installed via `pnpm add -g` on pnpm 11.

## Root Cause

- The `allowBuilds` config in our workspace `pnpm-workspace.yaml` only applies to workspace installs
- There is no mechanism in pnpm 11 to ship `allowBuilds` metadata in a published package that applies to consumers
- pnpm's global store has no pre-configured allowlist

## Affected Packages

Native deps requiring build approval in ph-clint-cli's dependency tree:
- `@apollo/protobufjs` (postinstall)
- `@sentry/cli` (postinstall)
- `esbuild` (postinstall — platform-specific binary)
- `protobufjs` (postinstall)

## Options

### Option 1: Recommend `npm install -g` for global CLIs

Switch onboarding docs from `pnpm add -g` to:
```bash
npm install -g @powerhousedao/ph-clint-cli
```

npm does not have this security gate. This is the most common pattern across the ecosystem — Vite, Turbo, Angular CLI, and others recommend `npm install -g` regardless of what package manager the user prefers for project-level work. The global CLI install and the project package manager are separate concerns.

**Pros**: Zero friction, works everywhere, no prompts
**Cons**: Requires npm (ships with Node.js, so always available)

### Option 2: `pnpm dlx` for one-off usage

```bash
pnpm dlx @powerhousedao/ph-clint-cli --help
```

Downloads and runs the CLI without installing it globally. Good for trying it out.

**Pros**: No global install, no persistent state
**Cons**: Re-downloads on every invocation, not suitable for daily use, still triggers the `allowBuilds` prompt

### Option 3: Document the `pnpm add -g` workaround

Tell users who insist on pnpm:
```bash
pnpm add -g @powerhousedao/ph-clint-cli --config.confirmBuilds=false
```

Or: press `a` (toggle all), Enter, then `y` at the prompt. This is a one-time operation per machine — pnpm saves the choices to the global config.

**Pros**: Still uses pnpm, one-time only
**Cons**: Confusing first-time experience, `--config.confirmBuilds=false` bypasses security for all packages (not scoped)

### Option 4: Provide an install script

```bash
curl -fsSL https://ph-clint.dev/install.sh | sh
```

Wraps the install with the right flags and handles the `allowBuilds` configuration.

**Pros**: Single-command onboarding
**Cons**: Requires hosting, `curl | sh` pattern has trust implications, maintenance burden

### Option 5: Reduce native dependencies

Audit the dependency tree and eliminate native deps where possible:
- `esbuild` — used by ph-clint-app's build tooling (Vite). Unlikely to remove.
- `protobufjs` / `@apollo/protobufjs` — transitive via `@powerhousedao/reactor`. Not under our control.
- `@sentry/cli` — transitive via Sentry SDK. Could potentially be replaced or made optional.

**Pros**: Fewer prompts, smaller install
**Cons**: Limited control over transitive deps, may not be feasible

## Recommendation

**Option 1** (recommend `npm install -g`) as the primary path, wrapped in **Option 4** (install script) for a smooth experience. The install script (`scripts/install-cli.sh`) handles both the `allowBuilds` issue and the stale shim issue below.

Document Option 3 as an alternative for pnpm purists.

## Impact on scaffolded projects

Scaffolded projects are **not affected**. The codegen already emits a `pnpm-workspace.yaml` with `allowBuilds` listing the required native packages. Users running `pnpm install` in a scaffolded project will not see any prompts.

---

## Problem 2: Stale v10 shims shadow new installs

### Symptoms

After upgrading pnpm from v10 to v11 and installing a package globally, the old version still runs:

```
$ pnpm add -g @powerhousedao/ph-clint-cli@0.1.0-dev.62
+ @powerhousedao/ph-clint-cli 0.1.0-dev.62    # ← reports success

$ ph-clint --version
v0.1.0-dev.61                                  # ← still the old version!
```

### Root Cause

pnpm 11 changed the global store layout:

| | pnpm 10 | pnpm 11 |
|---|---|---|
| Global store | `$PNPM_HOME/global/5/` | `$PNPM_HOME/global/v11/{hash}/` |
| Bin shims | `$PNPM_HOME/<bin-name>` | `$PNPM_HOME/bin/<bin-name>` |
| Isolation | Shared `node_modules` | Each package gets its own isolated dir |

The rationale: putting shims in a `bin/` subdirectory prevents internal directories (`global/`, `store/`, `.tools/`) from polluting shell tab-completion.

When upgrading from v10 to v11:
1. `pnpm add -g` installs the package into the new `global/v11/` layout
2. A new shim is created at `$PNPM_HOME/bin/<name>`
3. **The old shim at `$PNPM_HOME/<name>` is NOT cleaned up**
4. If `$PNPM_HOME` (without `/bin`) is still in PATH — which it is in any terminal opened before running `pnpm setup` — the old shim takes precedence
5. The old shim still points to `global/5/.../old-version`, so the old binary runs

### Related pnpm Issues

- [#11464](https://github.com/pnpm/pnpm/issues/11464) — `self-update` installs to `global/v11` but doesn't update legacy shims. Fixed in later v11 releases, but only for `self-update`, not `add -g`.
- [#10517](https://github.com/pnpm/pnpm/issues/10517) — `pnpm update --global` doesn't regenerate bin shims. Shims contain hardcoded version-specific paths that go stale.
- [#10883](https://github.com/pnpm/pnpm/issues/10883) — `pnpm up -g` doesn't update bin directory files. Old versions accumulate in the store.

### Impact on Users

**Every user who upgrades from pnpm 10 to 11 will hit this.** The upgrade path is a 6-step gauntlet:

1. `pnpm self-update` — installs v11 but old shim stays
2. `pnpm setup` — updates shell config (if user reads release notes)
3. Restart terminal — picks up new PATH
4. Manually clean old shims — or get confused by stale binaries
5. `pnpm add -g @powerhousedao/ph-clint-cli` — gets `allowBuilds` prompt
6. Navigate the prompt — CLI finally works

This also affects `npm install -g`: the stale pnpm shims shadow npm's global bin if `$PNPM_HOME` (without `/bin`) is still in PATH.

### Resolution

The install script (`scripts/install-cli.sh`) handles this automatically:

1. Detects pnpm version, offers upgrade from v10 → v11 with confirmation
2. Scans `$PNPM_HOME/` for stale v10 shims (shell scripts starting with `#!/bin/sh`)
3. Lists each shim with its target version, asks for confirmation before deleting
4. Updates PATH for the current session
5. Installs via `npm install -g` (avoids `allowBuilds` prompt)
6. Verifies the binary resolves to the correct location and version

The script defaults to dry-run mode (`--run` to execute).
