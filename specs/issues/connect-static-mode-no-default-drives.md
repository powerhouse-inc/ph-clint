# Connect static mode: no way to inject default drives at runtime

## Problem

When Connect is served as a pre-built static SPA (not via Vite dev server), there is no mechanism to configure `PH_CONNECT_DEFAULT_DRIVES_URL` at runtime. The env var is baked into the JavaScript bundle at Vite build time via `import.meta.env`, but the Switchboard drive URL (`http://localhost:{port}/d/{driveId}`) is only known after the reactor starts — long after the SPA was built.

This means published CLIs that embed Connect as static assets cannot automatically show the Switchboard drive. Users must manually add the remote drive URL in the Connect UI.

## Context

ph-clint ships Connect as a pre-built SPA inside published npm packages (see `ph-connect-production-deployment.md`). At publish time, `ph-cli connect build` compiles the SPA. At runtime, a lightweight static file server (`connect-server.ts`) serves it. The Switchboard starts alongside Connect, and the drive URL is only known once the reactor creates/finds the drive.

In Vite dev server mode (studio), `PH_CONNECT_DEFAULT_DRIVES_URL` is passed as a process env var to the `ph connect` child process, and Vite injects it into `import.meta.env` on the fly. This doesn't work for pre-built static assets.

## Current workaround

After starting the CLI, the user sees:

```
Connect 'ph-clint-studio' ready at http://localhost:43990/
  You may need to add the drive: http://localhost:59260/d/8c40abe6-...
```

They must then open Connect and manually add the remote drive URL.

## Desired behavior

Connect should automatically show the Switchboard drive without manual intervention, regardless of whether it's served via Vite dev server or as a static SPA.

## Possible solutions

### 1. Runtime env injection via HTML rewriting

The static file server could intercept requests for `index.html` and inject a `<script>` tag:

```html
<script>
  window.__PH_CONNECT_RUNTIME_ENV__ = {
    PH_CONNECT_DEFAULT_DRIVES_URL: "http://localhost:59260/d/8c40abe6-..."
  };
</script>
```

Connect would need to check `window.__PH_CONNECT_RUNTIME_ENV__` as a fallback when `import.meta.env.PH_CONNECT_DEFAULT_DRIVES_URL` is empty. This is a common pattern for Docker/static deployments (e.g., `env.js` or `runtime-config.json`).

**Requires change in**: Connect app (`apps/connect/src/utils/reactor.ts` or `connect.config.ts`)

### 2. Runtime config endpoint

The static server could expose a `/__config` endpoint returning JSON:

```json
{ "PH_CONNECT_DEFAULT_DRIVES_URL": "http://localhost:59260/d/..." }
```

Connect would fetch this on startup before initializing the reactor.

**Requires change in**: Connect app (add fetch-based config loading)

### 3. `loadRuntimeEnv()` fallback to `window.__env__`

The existing `loadRuntimeEnv({ processEnv: import.meta.env })` in `connect.config.ts` could also check a global object (injected by the server into `index.html`). This is the smallest change — one extra line in the env loading logic.

**Requires change in**: `packages/shared/connect/env-config.ts` or `apps/connect/src/connect.config.ts`

## Impact

Any deployment of Connect as static assets (npm published CLIs, Docker without nginx env substitution, static hosting) hits this limitation. The Docker deployment already works around it via nginx `sub_filter` or build-time env injection, but the npm/static case has no equivalent.

## Related

- `connect-default-drive-race-condition.md` — even when the env var IS set, a race condition can prevent the drive from being added if Switchboard isn't ready yet
- `ph-connect-production-deployment.md` — the plan that introduced static mode serving
