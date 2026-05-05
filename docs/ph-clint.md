# ph-clint + clint-common — Detailed Architecture

> Back to [architecture overview](./architecture.md)

## Introduction
- What ph-clint is
- The 5 packages at a glance
- Who this is for (framework users building CLIs)

## Features

### Part 1 — Basics

#### Config
- Config schema and secrets schema (Zod)
- 6-layer resolution (precedence order: config file flag → env vars → local `.ph/` → user `~/.ph/` → implementation defaults → schema defaults)
- Environment variable mapping convention (`{CLINAME}_{FIELD_NAME}`)
- Schema introspection (`getSchemaFields()`) — derives field metadata from Zod without manual descriptors
- Auto-generated `config` command (get / set / list / path / setup)
- Interactive setup prompting for missing required fields
- Sensitive field handling (secrets schema, censored output)
- Config file paths: `localConfigPath()`, `userConfigPath()`

#### Commands
- `defineCommand()` anatomy — id, description, inputSchema, outputSchema, execute handler
- `CommandContext` — what's available: config, workdir, logger, store, reactor accessor, agent accessor, event bus
- Input validation — Zod parsing with human-readable error formatting (`formatZodError()`)
- Auto-generated commands:
  - `config` — config management (from config schema)
  - `cli-docs` — CLI help formatted for agent consumption
  - Service commands — per service (covered in Part 2)
  - Skill commands — per skill (covered in Part 3)

#### Processes
- `ProcessManager` — bounded shell command execution
- Detached process groups (`detached: true`, `kill(-pid)`)
- Stdout/stderr capture and streaming
- Graceful shutdown (signal + timeout)

### Part 2 — Services

#### Service Manager
- Service definition model: `id`, `command`, `env`, `paramsSchema`, `maxInstances`
- Readiness detection — regex patterns on stdout, multi-pattern support, captures, timeout
- Endpoint capture and classification (`api-mcp`, `api-rest`, `api-graphql`, `website`, `other`)
- Preflight checks — `checkWorkdir()`, `checkCommand()`, `checkPort()` (run before spawn, first failure aborts)
- Restart policies — `enabled`, `maxRetries`, `delay`
- Shutdown — configurable signal and timeout
- Auto-generated commands per service: `{id}-start`, `{id}-stop`, `{id}-ps`, `{id}-logs`, `{id}-ls`
- Port resolution and deterministic defaults
- Project scanning — `ProjectScanner` interface, project-to-document linking

#### Proxy Service
- Embedded reverse proxy (`http-proxy`)
- Route building from services + Switchboard (`buildServiceRoutes()`, `buildSwitchboardRoutes()`)
- Longest-prefix-first matching
- WebSocket upgrade for MCP endpoints
- Website endpoints as catch-all at `/`
- Debug endpoints: `/_proxy/health`, `/_proxy/routes`
- Auto-injected proxy config fields when enabled

#### Built-in Services
- Connect service definition (`connectServiceDefinition()`)
  - Static mode — pre-built SPA assets served via standalone Node.js HTTP server
  - Studio mode — Vite dev server for development
- Auto-opens browser on readiness

#### Event Bus
- `createEventBus()` — typed pub/sub
- Powerhouse events (typed by registry):
  - `powerhouse:ready` — reactor initialized (payload: `driveId`)
  - `powerhouse:document:changed` — documents updated
  - `powerhouse:document:created` / `deleted`
- Service events: `service:ready`, `service:stopped`
- Custom events via string key (falls through to `unknown` payload)

#### Routines & Triggers
- `defineTrigger()` interface: `id`, `state()`, `setup()`, `poll()`, `teardown()`
- Tick-based routine loop — configurable tick interval (default 2000ms), idle interval (500ms)
- WorkItem types: `{ type: 'command', params }` and `{ type: 'function', params }`
- Per-trigger persistent state — isolated, managed by routine
- Routine lifecycle: init → ready → running → stopping
- Routine starts after services and reactor are ready
- `createRoutineServiceAdapter()` — wraps routine as a ServiceManager
- `createCompositeServiceManager()` — multiplexes process-based + routine-based services

### Part 3 — Agents

#### Mastra Agents
- `createMastraHelpers()` factory — returns `getTools`, `getAgentInstructions`, `createWorkspace`, `createMemory`, `wrapAgent`
- `getTools()` — merges CLI commands + MCP tools into unified tool set
- `commandsToMastraTools()` — converts `Command[]` to Mastra `createTool()` shape
- `discoverMcpTools()` — queries running services for `api-mcp` endpoints, creates/reuses MCPClient instances
- Tool namespacing: `{serviceId}-mcp__{toolName}` (with instance suffixes for multi-instance services)
- `wrapAgent()` — adapts Mastra Agent to framework `AgentProvider` interface
- `mapMastraStream()` — maps Mastra `fullStream` to framework `StreamChunk` (text-delta, tool-call, tool-result, error)
- `MarkdownConversationLogger` / `loggedStream()` — records sessions to markdown files
- `getMastraPaths()` — workspace and LibSQL database path resolution
- Lazy initialization — agent constructed only when first called

#### Agent Profiles
- Composable template sections — each profile = concatenation of Markdown files
- Multi-include directory search (multiple source paths)
- Handlebars rendering with build-time context variables
- `getAgentInstructions(agentId)` — loads rendered profile at runtime
- Build-time compilation via `buildAgentProfiles()` (in `ph-clint-dev`)

#### Skills

##### Internal Skills
- SKILL.md format — YAML frontmatter (`name`, `description`) + Markdown body
- Skill discovery — `readSkills()` scans artifact directories, deduplicates by name
- Skill command generation — `createSkillCommands()` creates CLI command per skill with `--prompt` flag
- Returns `SkillInvocation` — routed to agent with rendered instruction
- Template rendering — Handlebars with 8 built-in helpers (`formatDate`, `join`, `eq`, `exists`, `uppercase`, `lowercase`, `hasItems`, `default`)
- Template variable extraction and missing-variable warnings
- Skill installation — `installSkills()` copies to `.mastra/skills/`

##### External Skills
- GitHub-based installation
- `clint-skills-sync` command
- Configured via `spec.externalSkills` URLs

##### Front Skill
- Default/entry skill for the CLI

### Part 4 — Documents, Files & Workflows

#### Filesystem Workspace
- Working directory resolution — 3-level precedence (fallback → CLI flag → implementation override)
- `WorkdirStore` — file-based key-value persistence scoped to workdir (atomic writes via temp + rename)
- `MemoryWorkdirStore` — in-memory variant for testing
- Project scanning — `ProjectScanner` interface for custom project detection
- Project mapping — `getProjectMapping()` merges on-disk scan results with drive folder entries (path ↔ documentId ↔ folder path)
- Package identity — `readPackageInfo()` for CLI name, version, root path

#### Agent Drive and Folders
- Drive creation — `ensureDrive()` creates or finds local personal drive
- Remote drive sync — `ensureRemoteDrive()` syncs from remote Switchboard URLs
- `createFolderOperations()` API — `addDocument()`, `removeDocument()`, `listFolder()`, `ensureFolder()`, `findByType()`
- Operates on drive's internal node tree via `ADD_FOLDER` / `ADD_FILE` / `DELETE_NODE` operations
- Multi-drive configuration (single drive or named drives)

#### Working with Documents
- `defineRegistry()` — maps document type strings to modules from a readonly tuple
- Type inference: `InferRegistry`, `ActionOf<M>`, `RegistryEntry`
- `TypedReactorClient<R>` — narrowed CRUD methods per registry key (pure TypeScript, no runtime wrapping)
- `isDocType()` — runtime type guard for document type checking
- Reactor building — `buildReactor()` with PGlite persistent storage, document model registration, sync channel config
- `buildDefaultReactor()` — composition helper (reactor + drives + subscriptions + switchboard)
- `bridgeSubscriptions()` — wires reactor document change events into the event bus
- `createDocumentChangeTrigger()` — trigger factory for watching specific document types, event coalescing, initial reconcile on startup
- Deterministic ID generation — `deterministicId()` for reproducible reactor instance IDs

### Part 5 — Interfaces

#### TypeScript Library
- `createTypes()` — generic binding pattern, pre-binds `TConfig` and `Registry` for an entire project
- Exported factory APIs: `defineCli`, `defineCommand`, `defineTrigger`, `defineRegistry`, `createTypes`
- Exported infrastructure: `createEventBus`, `createProcessManager`, `createServiceManager`, `createRoutine`, `createProxyServer`
- Exported Powerhouse APIs: `buildDefaultReactor`, `buildReactor`, `startSwitchboard`, `createDocumentChangeTrigger`, `createFolderOperations`
- Exported Mastra APIs: `createMastraHelpers`, `mapMastraStream`, `commandsToMastraTools`, `discoverMcpTools`
- Type inference patterns — generics flow from schema through context to event payloads
- Testing harnesses:
  - `createStreamingClient()` — async generator-based test client with controllable I/O
  - `createTerminalClient()` — interactive terminal test client with key simulation (`KEYS` constants)

#### CLI
- Headless — `.run()` one-shot execution, piped stdin (`createStdinLineReader()`), exit codes
- Interactive stdio — Streaming mode, `StreamChunk` taxonomy (text-delta, tool-call, tool-result, tool-output, error), `formatStreamChunk()` with ANSI coloring
- Interactive REPL — `createReplSession()`:
  - Input parsing — `parseReplInput()` tokenization (quotes, pipes, redirects), fuzzy command matching
  - Tab completion — `getCompletions()`, `getGhostSuggestion()` (command names, flags, enum values)
  - Multi-step parameter prompting for missing required fields
  - Markdown rendering — `renderMarkdown()` via marked + marked-terminal
  - Output throttling — `useOutputThrottle()` adaptive rate-limiting with velocity ramping
  - Panel commands — `panel services`, `panel projects`
  - Conversation history and session state

#### APIs
- GraphQL API — `startSwitchboard()` wraps reactor via `@powerhousedao/reactor-api`, exposes GraphQL endpoint
- MCP API — MCP endpoint from Switchboard, tool namespacing for multi-service discovery

#### Web UI
- Drives & Folders — Connect (phase 3), browse/manage documents in personal drive
- Chat Sessions — `powerhouse/chat-session` document model, `writeAgentStreamToDocument()` bridge, `chatSessionWatchTrigger` for auto-invocation, re-entrancy protection
- (more coming soon)
