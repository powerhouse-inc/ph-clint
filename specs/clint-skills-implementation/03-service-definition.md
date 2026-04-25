# Skill: service-definition

## Why This Skill Exists

Services are the most complex feature in ph-clint. They involve process spawning, stdout pattern matching, endpoint capture, health checks, restart policies, and preflight validation — all orchestrated through a state machine. Getting readiness detection wrong means the CLI reports "ready" before the service is actually accepting connections, or never reports ready at all.

This skill exists because the interaction between readiness patterns, endpoint captures, and MCP discovery is non-obvious. A developer needs to understand that readiness patterns are ANDed (all must match), that captures extract URLs from regex groups, and that typed captures with `type: 'api-mcp'` automatically make those endpoints discoverable for agent tool loading.

## What The Skill Covers

- `defineService()` with all options
- Readiness detection: patterns, captures (simple and typed), timeout
- Preflight check factories: checkWorkdir, checkCommand, checkPort
- Shutdown and restart policies
- ServiceManager API: start, stop, list, logs, watchLogs
- Service events and event wiring
- Project scanner for multi-project services
- Service commands auto-generation

## What The Skill Does NOT Cover

- Process management for one-shot commands (see `command-definition` — processes.run)
- MCP tool discovery from service endpoints (see `agent-integration`)
- Routine loop integration (see `trigger-routine`)

## File Plan

### .preamble.md (~130 lines)

Service design principles:
- Services vs processes: services are long-running with lifecycle management, processes are one-shot with timeout
- Readiness is a contract: the service declares what "ready" looks like via stdout patterns, and the framework watches for those patterns. All patterns must match before the service is considered ready.
- Endpoint captures turn regex groups into named URLs. Simple form: `{ 'name': groupIndex }`. Typed form: `{ 'name': { group: index, type: 'api-mcp' } }`. The `type` field enables downstream features like MCP tool discovery.
- Preflight checks run before service start — fail fast with clear messages rather than spawning a process that will fail cryptically
- Shutdown config: signal (SIGTERM/SIGINT/SIGKILL) + timeout. After timeout, SIGKILL is sent.
- Restart policy: `{ enabled, maxRetries, delay }`. Failed services can auto-restart up to maxRetries times with delay between attempts.
- maxInstances controls concurrency — use 1 for exclusive services (dev servers), higher for parallel workers

Pattern matching pitfalls:
- Patterns match against stdout AND stderr combined — some tools log to stderr
- Regex must match a single line — patterns don't span lines
- Capture groups are 1-indexed (group 0 is the full match)
- If a pattern never matches, the service hits readiness timeout and is marked failed

Preflight check ordering:
- Check workdir first (cheapest, most common failure)
- Check required binaries second
- Check ports last (requires network I/O)

### .cli-docs.md

Extract from HTML docs:
- `defineService()` full options
- `ServiceDefinition<TConfig>` type
- `ReadinessConfig`, `ReadinessPattern`, `CaptureDefinition` types
- `EndpointType` union
- `PreflightCheck<TConfig>` and `PreflightResult` types
- `checkWorkdir()`, `checkCommand()`, `checkPort()`, `isPortFree()` signatures
- `ServiceManager` interface (start, stop, list, logs, watchLogs, scanProjects, purgeStoppedInstances)
- `ServiceInstanceStatus` type
- Service event payloads table
- `ProjectScanner` and `ProjectScanResult` types

### .result.md

> Service is defined with readiness detection, preflight checks, and lifecycle config. It is registered in defineCli, auto-generates management commands, and transitions through starting/ready/failed states correctly.

### 00.assess-service.md

Phase: Identify the service requirements.

Steps:
- What process does this service run? (command string or function)
- What does the process print to stdout when it's ready? (copy exact lines)
- What endpoints does it expose? (HTTP, GraphQL, MCP, WebSocket)
- What ports does it use? (need checkPort preflight)
- What binaries must be installed? (need checkCommand preflight)
- What working directory conditions apply? (need checkWorkdir preflight)
- Should it auto-restart on failure? How many times?
- Can multiple instances run simultaneously?
- Does it need runtime parameters (paramsSchema)?
- Does it need environment variables from config?

### 01.define-service.md

Phase: Write the defineService call. Import `defineService` from `../framework.js` for automatic config typing.

Steps:
- Set id (kebab-case), name (display), description
- Set command: static string or `(params) => string` for parameterized commands
- Set env function: `(config) => Record<string, string>` for config-derived env vars
- Add paramsSchema if runtime parameters needed
- Configure readiness:
  - Write regex patterns that match the service's actual stdout lines
  - Add captures for any URLs/ports the service exposes
  - Use typed captures `{ group, type: 'api-mcp' }` for MCP endpoints
  - Set timeout (default 30s, increase for slow services)
- Configure shutdown: signal and timeout
- Configure restart: enabled, maxRetries, delay

### 02.add-preflight.md

Phase: Add preflight validation checks.

Steps:
- Add `checkWorkdir()` if the service requires specific directory structure
- Add `checkCommand()` for required binaries (with version check if needed)
- Add `checkPort()` for each port the service uses (static number or `(config) => number`)
- Order checks from cheapest to most expensive
- Write clear error messages and hints for each check
- Test: start service in wrong directory, without binary, with port in use

### 03.add-project-scanner.md

Phase: Optional — add project scanning for multi-project services.

Steps:
- Define `projectScanner.isProjectFolder(dir)` — predicate that identifies project directories
- Define `projectScanner.getProjectName(dir)` — extracts a display name
- Scanner is used by `services.scanProjects(serviceId, rootDir)` for discovery
- Useful when one service definition can manage multiple project instances

### 04.wire-events.md

Phase: Handle service lifecycle events and register the service.

Steps:
- In codegen projects: update `project-spec.json` and run `{{commands.clint-project-regen.id}}` — this generates the `@clint:begin services` and `@clint:begin events` marker regions. Never hand-edit marker regions.
- In manual projects: add to `services` array and `events` config in `defineCli()` directly
- Events receive payload with `serviceId`, `instanceId`, `name`, and event-specific fields
- Available events: `service:pattern-matched`, `service:ready`, `service:failed`, `service:restarting`, `service:stopped`
- Use events for cross-cutting concerns: logging, notifications, dependent service startup

## Research Before Writing

| What | Where |
|------|-------|
| `defineService` function | `packages/ph-clint/src/core/services.ts` |
| `ServiceDefinition` type | `packages/ph-clint/src/core/types.ts` (search `ServiceDefinition`) |
| `ReadinessConfig`, `ReadinessPattern` | `packages/ph-clint/src/core/types.ts` (search `ReadinessConfig`) |
| `CaptureDefinition`, `EndpointType` | `packages/ph-clint/src/core/types.ts` (search `EndpointType`) |
| Readiness matching logic | `packages/ph-clint/src/core/services.ts` — search for pattern matching |
| Preflight check factories | `packages/ph-clint/src/core/preflight.ts` |
| `ServiceManager` interface | `packages/ph-clint/src/core/types.ts` (search `ServiceManager`) |
| Service event types | `packages/ph-clint/src/core/types.ts` (search `ServiceEvent`) |
| Service command generation | `packages/ph-clint/src/core/service-command.ts` |
| Project scanner | `packages/ph-clint/src/core/project-scanner.ts` |
| Service tests | `packages/ph-clint/tests/services.test.ts` |
| Example 05 (full services) | `examples/05-ph-rupert/src/services/` |
| HTML docs section | `packages/ph-clint/docs/index.html` — "Service Management" section |
