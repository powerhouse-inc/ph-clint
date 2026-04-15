# Connect silently drops default drive when switchboard is unavailable at startup

## Problem

Connect's in-browser reactor calls `addDefaultDrivesForNewReactor()` during `createReactor()`. If the switchboard is not reachable at that moment, the `addRemoteDrive` fetch fails and the drive is never added. On subsequent page loads the drive remains missing.

Two mechanisms prevent recovery:

1. **`window.ph.loading` guard** — `createReactor()` sets `window.ph.loading = true` on entry (line 2118) but never resets it. Any subsequent call (SPA navigation, hot-reload) returns immediately at line 2117 without retrying the default drives.

2. **`addRemoteDrive` fire-and-forget** — The error in `addDefaultDrivesForNewReactor` is caught and logged (`console.error`) but not surfaced or retried. There is no reconciliation step on later loads to check whether configured default drives are actually present.

This is a startup race condition. When a host application starts both switchboard and Connect as co-dependent services, Connect's Vite dev server typically becomes ready before switchboard finishes binding its port.

## Reproduction

1. Start Connect with `--default-drives-url` pointing at a switchboard that is **not yet running**:
   ```
   ph connect --port 3000 --default-drives-url http://localhost:4801/d/<driveId>
   ```
2. Open `http://localhost:3000` in a fresh browser (no prior state).
3. Console shows:
   ```
   Failed to add default drive http://localhost:4801/d/<driveId>: TypeError: Failed to fetch
   ```
   Home screen shows "Create New Drive" — no remote drive.
4. Start switchboard on port 4801 (confirm it responds to GraphQL queries).
5. Reload `http://localhost:3000`.
6. **Expected**: Drive appears on home screen.
   **Actual**: Empty home, no drive, no errors in console. `createReactor` either skips entirely (loading guard) or runs but `addDefaultDrivesForNewReactor` is not retried.

## Root cause

In `@powerhousedao/reactor` browser bundle (`reactor-*.js`), `createReactor`:

```js
// line 2115
async function createReactor(localPackage) {
  if (!window.ph) window.ph = {};
  if (window.ph.loading) return;       // ← guard: never retries after first call
  window.ph.loading = true;            // ← set once, never cleared
  // ... setup ...
  const defaultDrivesConfig = getDefaultDrivesFromEnv();
  if (defaultDrivesConfig.length > 0)
    await addDefaultDrivesForNewReactor(defaultDrivesConfig);  // ← line 2160
  // ...
}

// line 1577
async function addDefaultDrivesForNewReactor(defaultDriveUrls) {
  for (const url of defaultDriveUrls) try {
    await addRemoteDrive(url);          // ← fetch to switchboard, throws if down
  } catch (error) {
    console.error(`Failed to add default drive ${url}:`, error);  // ← swallowed
  }
}
```

`addRemoteDrive` (in `dist-*.js` line 2289) does:
```js
async function addRemoteDrive(url, driveId) {
  // ...
  const response = await fetch(url);   // ← ERR_CONNECTION_REFUSED when switchboard is down
  // ...
  // If sync already exists for this drive, returns early (idempotent) — safe to call repeatedly
  if (sync.list().find(remote => remote.collectionId === collectionId)) return resolvedDriveId;
  // ...
}
```

Note: `addRemoteDrive` is already idempotent — if the drive sync exists it returns early. This means reconciliation on every load is safe and cheap.

## Suggested fix

**Reconcile default drives on every `createReactor` call**, not just the first. Since `addRemoteDrive` is idempotent (checks `sync.list()` before adding), this is safe:

```js
async function createReactor(localPackage) {
  if (!window.ph) window.ph = {};
  if (window.ph.loading) return;
  window.ph.loading = true;

  // ... existing setup (reactor, drives, renown, etc.) ...

  // ── CHANGED: reconcile default drives on every load, not just "new" reactors ──
  const defaultDrivesConfig = getDefaultDrivesFromEnv();
  if (defaultDrivesConfig.length > 0) {
    await reconcileDefaultDrives(defaultDrivesConfig);
  }

  // ... rest of createReactor ...
}

/**
 * Ensure all configured default drives are present in the reactor.
 * Safe to call on every load — addRemoteDrive is idempotent.
 * Retries failed drives with a short backoff to handle the common case
 * where switchboard is still starting up.
 */
async function reconcileDefaultDrives(defaultDriveUrls) {
  const MAX_ATTEMPTS = 3;
  const BACKOFF_MS = 2000;

  for (const url of defaultDriveUrls) {
    let added = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !added; attempt++) {
      try {
        await addRemoteDrive(url);
        added = true;
      } catch (error) {
        if (attempt < MAX_ATTEMPTS) {
          console.warn(
            `Default drive ${url} not reachable (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${BACKOFF_MS * attempt}ms...`
          );
          await new Promise(r => setTimeout(r, BACKOFF_MS * attempt));
        } else {
          console.error(
            `Failed to add default drive ${url} after ${MAX_ATTEMPTS} attempts:`,
            error
          );
        }
      }
    }
  }
}
```

This also requires resetting the loading guard so full page reloads re-enter `createReactor`:

```js
// At the end of createReactor, after all setup is complete:
window.ph.loading = false;
```

## Impact

Any tool that co-starts switchboard + Connect hits this race on first launch. The user sees an empty Connect with no indication of what went wrong. In agent-chat scenarios, the agent never receives messages because there is no drive to hold documents.

## Workaround

Clear browser storage (IndexedDB + localStorage) for `localhost:3000` and reload after switchboard is running. Alternatively, manually add the drive via Connect's UI.

## Environment

- `@powerhousedao/reactor`: 6.0.0-dev.170
- `@powerhousedao/reactor-api`: 6.0.0-dev.170
- Connect via `ph connect` (ph-cli)
- Reproduced in Chromium (headless), expected to affect all browsers
