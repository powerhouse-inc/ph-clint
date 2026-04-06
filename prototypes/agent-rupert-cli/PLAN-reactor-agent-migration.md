# Migration Plan: ReactorPackageDevAgent → Mastra

Branch: `feature/reactor-package-dev-agent`

## Step 1: Copy task infrastructure

**Target: `src/tasks/`**

Copy from `../agent/src/tasks/`:
- [x] `types.ts` — BaseTask, CLITask, ServiceTask, ServiceHandle, ReadinessPattern, etc.
- [x] `executors/errors.ts` — TaskExecutionError, TaskTimeoutError, TaskValidationError, TaskProcessError
- [x] `executors/base-executor.ts` — BaseExecutor (EventEmitter, process spawning, graceful kill)
- [x] `executors/cli-executor.ts` — CLIExecutor (shell commands with retry + streaming)
- [x] `executors/service-executor.ts` — ServiceExecutor (long-running services with readiness detection, port monitoring)

No Mastra dependencies. These are our own reusable constructs.

## Step 2: Copy project managers

**Target: `src/project-managers/`**

Copy from `../agent/src/agents/ReactorPackageDevAgent/`:
- [x] `AbstractProjectManager.ts` — base class with init/list/run/shutdown lifecycle
- [x] `ReactorPackagesManager.ts` — Reactor-specific: `ph init`, `ph vetra --watch`, Vetra readiness detection

Update import paths to reference `../tasks/` in the new location.

Fusion managers are **excluded** — they'll become a separate agent later.

## Step 3: Create singleton instances

**Target: `src/project-managers/instances.ts`**

- [x] Create module-level `ReactorPackagesManager` singleton configured from env vars
  - `PROJECTS_BASE_PATH` (default: `../projects`)
  - `REACTOR_PACKAGES_PATH` (subdirectory, default: `reactor-packages`)
  - `VETRA_CONNECT_PORT` (default: 5000)
  - `VETRA_SWITCHBOARD_PORT` (default: 6100)
  - `VETRA_STARTUP_TIMEOUT` (default: 90000)

Mastra tools only receive `inputData` — no DI/context. Tools import from this module.

## Step 4: Create Mastra tools

**Target: `src/mastra/tools/reactor-tools.ts`**

Convert 8 tools from Claude Agent SDK `tool()` to Mastra `createTool()`:

- [x] `init-project` — initialize a new Reactor Package project
- [x] `list-projects` — list all available projects and their status
- [x] `run-project` — run a project (start Vetra Studio + Switchboard)
- [x] `shutdown-project` — shutdown the running project
- [x] `get-project-logs` — get recent logs from the running project
- [x] `get-project-status` — get current status (ports, URLs, readiness)
- [x] `is-project-ready` — check if the project is fully started
- [x] `get-projects-dir` — get the projects directory path

**Side effects (run/shutdown):** The original `run_project` called `agent.addMcpEndpoint()` and `agent.setWorkDir()`. Since Mastra tools are stateless, we store runtime info (MCP endpoint URL, project path) on the singleton and return it in the tool response. The agent sees this in the response text and can reference it. The routine layer (later) can act on it programmatically.

## Step 5: Create the Mastra agent

**Target: `src/mastra/agents/reactor-package-dev-agent.ts`**

- [x] Flatten system prompt from `AgentBase.md` + `ReactorPackageDevAgent.md`
  - Remove Handlebars templates — inject config values directly
  - Remove references to Claude Agent SDK MCP tools (`mcp__agent-manager-drive__*`, etc.)
  - Remove self-reflection / skills / inbox / WBS references (deferred)
  - Keep: Powerhouse technology primer, document model expertise, project management rules
- [x] Model: `anthropic/claude-haiku-4-5`
- [x] Tools: all 8 reactor tools
- [x] Memory: `new Memory()` for conversation persistence

## Step 6: Register in `src/mastra/index.ts`

- [x] Import and register the new agent
- [x] Change `defaultAgentId` to `reactor-package-dev-agent`
- [x] Keep weather agent registered (still useful as a secondary agent / example)

## Step 7: Update CLI command registry

- [x] Update `src/commands/registry.ts`: replace or supplement the `weather` command with a `reactor` command (or similar)
- [x] Verify interactive mode (`rupert -i`) and one-shot prompts route to the new default agent

## Deferred (not in this branch)

- **Fusion tools/agent** — separate agent, separate branch
- **Self-reflection tools** — depend on skills/scenarios system (AgentBase.getSkills, etc.)
- **AgentRoutine** — continuous inbox/WBS polling loop, will call the Mastra agent instead of Claude SDK
- **Dynamic MCP registration** — Vetra MCP endpoint auto-wiring at routine layer
