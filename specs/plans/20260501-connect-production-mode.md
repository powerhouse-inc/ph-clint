# Connect Production Mode — Build & Publish Fix

## Problem

When ph-pirate-cli is installed globally (`pnpm install -g`), Connect fails:

```
command:  ph connect --port 46470
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "ph-cli" not found
```

Connect has two modes:
- **Studio mode**: runs `ph connect --port <p>` (Vite dev server via ph-cli)
- **Static mode**: runs `node connect-server.js --dir <assetsDir> --port <p>`

Mode is selected by whether `assetsDir` is set. Auto-detection in `configureReactor()` checks:
```
{connect.workdir}/dist/connect/index.html
```
If found, `assetsDir` is set and static mode activates. If not, studio mode.

In a global install, `connect.workdir` resolves into pnpm's global store:
```
.../node_modules/@powerhousedao/ph-pirate-app/
```

The published app package only contains `dist/{browser,node}/` — no `dist/connect/`.
So auto-detection fails, studio mode activates, and `ph connect` fails because
`ph-cli` is not a dependency of the published app.

## Root Cause

`ph connect build` outputs to `.ph/connect-build/dist/` by default, which:
1. Is not under `dist/` and therefore excluded by `"files": ["/dist"]`
2. Does not match the auto-detection path `dist/connect/index.html`
3. Is never run during the publish pipeline (`ph-publish` only runs `pnpm build`)

## Verified Facts

- `ph connect build --outDir dist/connect` works and produces `dist/connect/index.html`
- `"files": ["/dist"]` includes `dist/connect/` — it would be published
- `connect-server.js` exists in published ph-clint and works for static serving
- Readiness pattern (`Local:\s*https?://...`) matches connect-server.js output
- Auto-detection at `configureReactor()` line 271-275 checks `dist/connect/index.html`

## Fix

Route connect build output to `dist/connect/` in two places:

### 1. Publish pipeline (`packages/ph-clint-dev/src/publish/build.ts`)

After `pnpm build` for `category: 'app'` packages that have a `connect` script,
also run: `pnpm connect build --outDir dist/connect`

### 2. Root package.json codegen (`packages/ph-clint-cli/.../root-package-json.ts`)

Change the connect build step from:
```
pnpm --prefix <app> connect build
```
to:
```
pnpm --prefix <app> connect build --outDir dist/connect
```

This keeps local `pnpm build` consistent with publish.

### 3. Fix ph-pirate directly

Same change in `sandbox/ph-pirate/package.json`.

## Dev vs Production Behavior

- **Dev**: `dist/connect/` typically absent (nobody runs `connect build` locally) ->
  auto-detection finds no assets -> studio mode -> `ph connect` (Vite dev server)
- **Production**: publish pipeline runs `connect build --outDir dist/connect` ->
  assets published in app package -> auto-detection finds them -> static mode ->
  `node connect-server.js` (no ph-cli needed)
- **Local build**: `pnpm build` from root runs connect build with `--outDir dist/connect` ->
  static mode activates. To force studio mode, delete `dist/connect/` or use `pnpm dev`.

## Verification Flag

`ph-publish --verify-connect` checks that `dist/connect/index.html` exists after the
connect build step for app packages. Included in all `publish:*` scripts in the root
package.json when Connect is enabled. Errors with a clear message if assets are missing.

## Resolved

- `pnpm connect build --outDir dist/connect` passes args through correctly ✓
- `"files": ["/dist"]` includes `dist/connect/` ✓
- Auto-detection at `configureReactor()` picks up `dist/connect/index.html` ✓
