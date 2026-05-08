# Issue: regen-time `pnpm install` fails the `allowBuilds` gate after `ph install` mutates the workspace yaml

## Status

**Open.** Reproduced consistently on a fresh sandbox project with Mastra +
Routine + Connect + chat enabled. Caught while debugging the codegen fix for
glob-based `framework.gen.ts` (TS2339/TS2883).

## Symptoms

After scaffolding a project, then editing the spec to add a glob package and
the clint-common chat-session entry, `clint-project-regen` fails its post-gen
install step:

```
[spec-change] regenerated ph-pirate-cli in 10ms: 4 written, 0 skipped, 0 deleted

▶ pnpm install --no-frozen-lockfile
   …
   Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
   [ERROR] Command failed with exit code 1: pnpm install
   pnpm: Command failed with exit code 1: pnpm install
       at runDepsStatusCheck (…/pnpm.mjs:210581:7)

[4/4] Build (ph-pirate-cli)... skipped (dependency failed)
Post-generation: 2 succeeded, 1 failed, 1 skipped.
```

The file emission completes (`framework.gen.ts` etc. are written correctly),
but `workspace-install` exits 1 and `cli-build` is skipped.

## Reproduction

1. `./clint-dev.sh clint-project-init --dir ph-pirate-cli --name ph-pirate-cli --enablePowerhouse --enableMastra --enableRoutine`
   — installs cleanly.
2. Edit `.ph/ph-clint-cli/project-spec.json` to add:
   - `features.mastra.common.enableChat: true`
   - A glob package `{ packageName: "ph-pirate-app", documentTypes: ["*/*"] }`
   - The clint-common entry `{ packageName: "@powerhousedao/clint-common", documentTypes: ["powerhouse/chat-session"] }`
3. `./clint-dev.sh clint-project-regen --dir ph-pirate-cli` → workspace-install
   fails as above.

## Root cause

The codegen builder `buildPnpmWorkspaceYaml`
(`packages/ph-clint-dev/src/codegen/builders/pnpm-workspace-yaml.ts`) emits a
canonical `allowBuilds:` block where every known native-build package is
mapped to `: true`:

```yaml
allowBuilds:
  '@apollo/protobufjs': true
  '@datadog/pprof': true
  '@parcel/watcher': true
  '@prisma/client': true
  '@prisma/engines': true
  '@sentry/cli': true
  esbuild: true
  prisma: true
  protobufjs: true
  sqlite3: true
  unrs-resolver: true
```

`allowBuilds` is the correct pnpm 11 field — confirmed by 89 occurrences in
the bundled `pnpm.mjs` (vs. zero for `onlyBuiltDependencies`/etc.). pnpm reads
the map and runs install scripts only for entries set to `true`.

Between `ph init` and the next regen, **`ph install`** (run by the
`app-ph-install` post-gen action when clint-common's `enableChat` flips on)
**rewrites the same `pnpm-workspace.yaml`**. After the mutation, the sandbox
file looks like this:

```yaml
allowBuilds:
  '@apollo/protobufjs': set this to true or false
  '@parcel/watcher': set this to true or false
  '@sentry/cli': true
  esbuild: set this to true or false
  protobufjs: set this to true or false
  unrs-resolver: set this to true or false
```

The shape changed in three ways:

1. **Different package set.** `@datadog/pprof`, `@prisma/*`, `prisma`,
   `sqlite3` are dropped; the rest survive but the list is now `ph install`'s
   idea of what's relevant, not the codegen's.
2. **Placeholder string values.** Everything except `@sentry/cli` is set to
   the literal string `set this to true or false`. pnpm's allowBuilds reader
   only treats the boolean `true` as approved (line in pnpm.mjs:
   `Object.values(ctx.modulesFile.allowBuilds).some((v) => v === true)`); any
   other value — including a non-empty string — is treated as **not
   approved**. So `@parcel/watcher`, `protobufjs`, `unrs-resolver`, etc.
   become unapproved.
3. **`@sentry/cli: true` survives** because that's the package the
   `app-ph-install` action explicitly passes via `--allow-build=@sentry/cli`
   (per `runPhInstallPackages` in `packages/ph-clint-dev/src/codegen/scaffold.ts`).

When `workspace-install` then runs raw `pnpm install --no-frozen-lockfile`
(see `packages/ph-clint-dev/src/codegen/actions.ts:507-518`), pnpm walks the
module tree, finds an unapproved transitive needing scripts (most likely
`@parcel/watcher` or `unrs-resolver` from the new clint-common dep tree),
sees the placeholder string for it in `allowBuilds`, and aborts with the
`approve-builds` message. `CI=true` (set by the action to suppress
interactive prompts) makes pnpm exit non-zero instead of prompting.

## Why the init flow worked

The init flow's install ran before `ph install` had a chance to mutate the
yaml — the codegen-emitted version with all-`true` values was still in
place. The chat-enabled spec only triggers the `app-ph-install` action on a
later regen (because `enableChat` was off at init time in this repro), so
init succeeds, regen does not.

For specs that enable chat from the start (e.g. existing `chat-switchboard`
e2e fixture), `app-ph-install` runs during init's post-gen pipeline and
mutates the yaml in the same way — but `workspace-install` already ran
before `app-ph-install` in that ordering, so the install side never sees the
broken yaml. The first install survives by virtue of timing; any subsequent
install (including all regens after ph install has touched the file) hits
the gate.

## Resolution

Two options, listed by surgical-ness:

### Option A — re-emit `pnpm-workspace.yaml` before every install action

In `packages/ph-clint-dev/src/codegen/actions.ts:507-518` (the
`workspace-install` / `cli-install` handler), call `buildPnpmWorkspaceYaml`
and overwrite the file before invoking `pnpm install`. This treats
`pnpm-workspace.yaml`'s `allowBuilds` block as machine-owned and restores
the canonical content on every install — third-party mutations are
overwritten back to `: true` for every package in the codegen's known list.

Pros: matches the existing "machine-owned file" mental model that the rest
of codegen uses. Single localized fix. No dependency on `ph install`'s
internal behaviour.

Cons: silently overrides whatever `ph install` was trying to communicate
via the placeholder strings. If `ph install` is intentionally asking the
user a question by writing `set this to true or false`, that question
disappears.

### Option B — replace raw `pnpm install` with `ph install` (no package args)

If `ph install` (with no package argument) does a workspace sync that
passes `--allow-build=…` for the right set of packages, swap it in for the
`workspace-install` / `cli-install` action's `pnpm install` call. Needs
verification: `ph-cli`'s install command may not support the no-package
form, and it may have its own opinions about the workspace yaml shape.

Pros: keeps `ph install` as the single owner of the allowBuilds block.

Cons: more dependency on upstream behaviour; introduces a divergence
between init-time and regen-time install commands today.

### Recommendation

**Option A.** Make `workspace-install` / `cli-install` re-emit the codegen
yaml before running install. It's a five-line change in `actions.ts`, fits
the existing model, and decouples regen reliability from `ph install`'s
mutation semantics. If `ph install` later starts encoding meaningful
configuration into the yaml, we can re-evaluate — but right now its
placeholder strings are net-negative for our pipeline.

## Adjacent observations

- The codegen's `allowBuilds:` package list (`@datadog/pprof`,
  `@prisma/*`, `prisma`, `sqlite3`) doesn't match `ph install`'s list.
  Worth reconciling so that whichever side wins, the result is a working
  install. Probably best to expand the codegen list to the union of both.
- `packages/ph-clint-dev/src/codegen/actions.ts:509` says "CI=true
  suppresses pnpm 11's interactive build-script approval prompt". CI=true
  does not auto-approve — it converts the prompt into a non-zero exit. The
  comment is misleading; once Option A lands, the env var becomes
  unnecessary (allowBuilds covers it).
- The post-gen action chain ordering matters: `workspace-install` runs
  before `app-ph-install` at init time, but only `app-ph-install` runs at
  regen time when `enableChat` flips on (after which `workspace-install`
  re-runs on the broken file). Tightening the order — running
  `workspace-install` last — would also paper over this, but it doesn't
  fix the underlying yaml-corruption issue and would change other ordering
  invariants.
