# `ph connect` unavailable in published packages

## Problem

When `@powerhousedao/ph-clint-cli` is installed globally (`pnpm install -g`), the Connect service fails to start because `ph connect` requires a full development environment (source files, `ph-cli` as a local binary, Vite) that isn't present in the published `@powerhousedao/ph-clint-app` package.

## Root cause

The published `ph-clint-app` package includes only `/dist` (compiled library bundles via `"files": ["/dist"]`). This is correct for its role as an importable library, but `ph connect` expects a source project:

1. **`ph-cli` is a devDependency** — not installed in published package's `node_modules`
2. **Source files missing** — `ph build` (tsdown) fails: "Cannot find entry: index.ts, ..."
3. **`ph connect` runs Vite's dev server** — needs the full project with `vite.config.ts`, source files, etc.

## Reproduction

```sh
pnpm install -g @powerhousedao/ph-clint-cli@0.1.0-dev.7
ph-clint -i
# Switchboard starts fine
# Connect fails: "Command 'ph-cli' not found"
```

Even after `pnpm install` in the app directory (which installs `ph-cli` from devDependencies), `ph connect` still fails because source files aren't present.

## What's needed

A way to serve the Connect web UI from a published/deployed package. Possible approaches:

1. **Pre-built static assets in the published package** — include a built Vite output (e.g. `dist/connect/`) in the `"files"` field, and serve it with a simple static file server instead of the Vite dev server.

2. **A `ph connect --serve` mode** — that serves pre-built assets from the installed `@powerhousedao/connect` package (or from the app's dist) rather than running Vite in dev mode.

3. **A `ph-cli service` or `service-startup.sh` production entry point** — the app's `package.json` references `service-startup.sh` and `service-unstartup.sh` scripts, but these aren't present in the published `ph-cli` dist. If these are the intended production mechanism, they need to be included.

4. **Docker** — the app has a `Dockerfile` and `docker/` scripts (`connect-entrypoint.sh`, `nginx.conf`, `switchboard-entrypoint.sh`), but these aren't included in the published package either (`"files": ["/dist"]`).

## Current state

The Switchboard works fine in the published package (it runs via the ph-clint library's built-in reactor). Only Connect is broken because it depends on the `ph-cli` development toolchain.

## Workaround

For now, the Connect service command includes `pnpm install --prefer-offline && ph connect` which installs `ph-cli` from devDependencies before starting. This gets `ph connect` to launch Vite, but:
- Adds ~8s startup delay for the install
- Still runs Vite in dev mode (not ideal for production)
- Requires network access on first run (to fetch devDependencies)

## Affected components

- `packages/ph-clint/src/integrations/powerhouse/connect.ts` — service command
- `packages/ph-clint-cli/ph-clint-app/package.json` — published file list and scripts
