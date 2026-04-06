# Reactor Tools — Issue Analysis

## Issue 1: `init-project` times out

**Symptom:** `init-project` fails with `Task timed out after 60000ms`.

**Root cause:** `AbstractProjectManager` creates a default `CLIExecutor` with a 60-second timeout. `ph init` + `pnpm install` routinely exceeds this.

**Fix applied:** `instances.ts` now passes an explicit CLIExecutor with 5-minute timeout (configurable via `CLI_TIMEOUT_MS` env var).

**Side effect discovered:** The partial `ph init` created files under `src/mastra/projects/reactor-packages/` which gets picked up by `tsconfig.json` (`include: ["src"]`). Need to either:
- Exclude `src/mastra/projects` in tsconfig, or
- Move the projects directory outside of `src/` entirely (see Issue 3)

**Status:** Timeout fix applied. Path issue tracked as Issue 3.

---

## Issue 2: `run-project` reports success but service is unreachable

**Symptom:** Tool returns `success: true` with ports (connectPort: 6102, switchboardPort: 5002), but the URLs are unavailable.

**Possible causes (to investigate):**

1. **Premature success — boot timeout resolves instead of readiness patterns matching.**
   The `ServiceExecutor` has a boot timeout (default 30s) that, on expiry, calls `transitionToRunning()` even if readiness patterns haven't matched. The `ReactorPackagesManager.runProject()` then resolves with `success: true` because the timeout resolved the promise (with null driveUrl/mcpServer). Notice the tool output has no `driveUrl` or `mcpServer` — suggesting patterns didn't match.

2. **Service exits immediately after "starting".**
   The service may crash on startup (wrong working directory, missing dependencies, port conflict). The `service-exited` handler sets `runningProject = null`, but `runProject()` already returned success. There's no mechanism to detect early exit after the readiness promise resolves.

3. **Port swap in the tool layer.**
   Looking at the tool output: `apiPort: 6102` mapped to `connectPort`, `appPort: 5002` mapped to `switchboardPort`. But in the tool code, `apiPort` maps to `connectPort` and `appPort` maps to `switchboardPort`. The `RunProjectOptions` interface has `connectPort` (Connect Studio) and `switchboardPort` (Vetra Switchboard). Check whether the agent swapped the port semantics — Connect is the UI (lower traffic), Switchboard is the API (higher traffic). The naming `apiPort`/`appPort` in the tool schema may be confusing the model.

4. **Process spawns but CWD or environment is wrong.**
   The project path resolves from `PROJECTS_BASE_PATH` relative to `process.cwd()`. When running via `mastra dev`, the CWD may differ from when running via `rupert` CLI. The `ph vetra --watch` command may fail silently if run from the wrong directory.

**What's missing:** No `driveUrl` or `mcpServer` in the output. If the service had fully started, these would be populated from readiness pattern captures. This strongly suggests cause #1 (boot timeout fired before patterns matched) or cause #2 (service crashed before patterns could match).

**Next steps:**
- Check `get-project-status` and `get-project-logs` immediately after `run-project` returns
- Verify the service process is still alive after the tool returns
- Add the `driveUrl`/`mcpServer` fields as a readiness indicator in the tool output

---

## Issue 3: Projects directory resolves inside `src/`

**Symptom:** Projects are created at `src/mastra/projects/reactor-packages/` which pollutes the TypeScript compilation.

**Root cause:** `PROJECTS_BASE_PATH` defaults to `../projects` and `AbstractProjectManager` resolves it via `path.resolve(process.cwd(), projectsDir)`. When Mastra dev server runs, CWD may be `src/mastra/` or similar, causing the path to land inside the source tree.

**Needs decision:** Where should the projects directory live? Options:
- Outside the repo entirely (e.g. `~/powerhouse-projects/`)
- At repo root level (e.g. `./projects/`, excluded from tsconfig and gitignore)
- Configurable via `.env` with a sensible absolute-path default

---

## Configuration gaps

The following env vars need to be documented and have sensible defaults for the Mastra dev context:

| Variable | Current default | Issue |
|----------|----------------|-------|
| `PROJECTS_BASE_PATH` | `../projects` (relative) | Resolves differently depending on CWD |
| `REACTOR_PACKAGES_PATH` | `reactor-packages` | Fine as subdirectory |
| `VETRA_CONNECT_PORT` | 5000 | May conflict with other services |
| `VETRA_SWITCHBOARD_PORT` | 6100 | May conflict with other services |
| `VETRA_STARTUP_TIMEOUT` | 90000 (90s) | May be too short for cold starts |
| `CLI_TIMEOUT_MS` | 300000 (5min) | Newly added, needs documentation |
