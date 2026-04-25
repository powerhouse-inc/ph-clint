# Skill: agent-integration

## Why This Skill Exists

AI agent integration is the most common reason developers choose ph-clint over plain Commander.js. But the integration surface is large: lazy loading, demo fallback, MastraHelpers, streaming protocol, MCP tool discovery, memory, workspaces, and conversation logging. Without guidance, developers either over-engineer (importing Mastra eagerly, breaking CLI startup for non-agent users) or under-engineer (skipping demo mode, making the CLI unusable without an API key).

The key insight is the **AgentProvider abstraction**. Whether the backing implementation is Mastra, a demo echo, or a custom LLM wrapper, the CLI only sees `{ id, stream(prompt, opts) }`. This separation is what enables demo-first development and clean testing.

## What The Skill Covers

- `cli.configureAgent()` — lazy agent loader setup
- `AgentProvider` interface — the abstraction the CLI consumes
- Demo agent implementation (no LLM dependency)
- MastraHelpers: getTools, getAgentInstructions, createWorkspace, createMemory, wrapAgent
- StreamChunk protocol: text-delta, tool-call, tool-result, error
- MCP tool discovery from running services
- Conversation logging with MarkdownConversationLogger
- Config patterns: API key presence gates real vs demo agent

## What The Skill Does NOT Cover

- Defining commands that become agent tools (see `command-definition`)
- Service definitions that expose MCP endpoints (see `service-definition`)
- Powerhouse-specific agent tools (see `ph-integration`)

## File Plan

### .preamble.md (~130 lines)

Agent architecture principles:
- The agent is optional and lazy-loaded — `configureAgent()` registers a factory function, not an agent instance. The factory is only called when someone sends bare text in the REPL or uses `--resume`.
- Demo-first development: always implement a demo agent that works without API keys. This makes testing possible without LLM costs and gives users a working CLI out of the box.
- AgentProvider is the interface boundary:
  ```
  { id: string; stream(prompt: string, opts?: { threadId? }): AsyncGenerator<StreamChunk> }
  ```
  The CLI doesn't know or care what's behind it.
- Mastra is imported dynamically (`await import(...)`) inside the agent loader — never at module top level. This keeps CLI startup fast and avoids breaking when Mastra isn't installed.
- StreamChunk is the streaming protocol: `text-delta` for incremental text, `tool-call` for tool invocation, `tool-result` for tool output, `error` for failures. The REPL renders these chunks in real-time.
- MCP tool discovery: when services have `api-mcp` typed endpoint captures, `getTools({ MCPClient })` automatically connects to those MCP servers and makes their tools available to the agent. Tools are prefixed: `{serviceId}-mcp__toolName`.

AgentSetupContext — what the loader receives:
- `workdir`, `config` — resolved values
- `cliName`, `cliVersion` — for agent metadata
- `context` — full CommandContext (workspace, services, processes, etc.)
- `commands` — all registered commands (the loader can convert them to tools)
- `skills` — skills assigned to this agent in prompts config

Pitfalls:
- Importing Mastra at top level — breaks CLI for users without Mastra installed
- Not checking for API key before creating real agent — cryptic auth errors
- Forgetting `maxSteps` in wrapAgent — defaults to 30, but complex agents may need more
- Not passing MCPClient to getTools — MCP discovery silently skipped
- Thread IDs: `--resume threadId` continues a conversation, but the thread must exist in memory DB

### .cli-docs.md

Extract from HTML docs:
- `AgentProvider` and `StreamChunk` types
- `AgentSetupContext` interface
- `AgentLoader<TConfig>` type
- `MastraHelpers` methods table (getTools, getAgentInstructions, createWorkspace, createMemory, wrapAgent)
- `formatStreamChunk()` and `renderStream()` utilities
- `MarkdownConversationLogger` constructor and methods
- `loggedStream()` wrapper function

### .result.md

> Agent is configured with lazy loading. Demo agent works without API key. When API key is present, Mastra agent loads with tools, memory, and workspace. Bare text in REPL routes to agent. Streaming output renders correctly.

### 00.configure-agent-loader.md

Phase: Set up the agent loader with API key gating.

Steps:
- In codegen projects: the `@clint:begin mastra` marker region contains `cli.configureAgent(createAgent)`. The agent factory file is user-owned — edit it directly. Update `project-spec.json` to enable Mastra and run `{{commands.clint-project-regen.id}}` to regenerate the marker region. Never hand-edit `cli.ts` markers.
- In manual projects: after `defineCli()`, call `cli.configureAgent(async (ctx) => { ... })`
- Check `ctx.config.apiKey` (or equivalent) — if absent, return demo agent
- If present, dynamically import Mastra and create real agent
- The loader is async — it can await imports, database setup, etc.
- Return an `AgentProvider` in both paths

### 01.create-demo-agent.md

Phase: Implement a demo agent that works without an LLM.

Steps:
- Implement `AgentProvider` directly:
  ```
  { id: 'demo', async *stream(prompt) { yield { type: 'text-delta', text: `Echo: ${prompt}` } } }
  ```
- Make it useful: echo input, list available commands, show help
- Can simulate tool calls for testing: yield tool-call then tool-result chunks
- Demo agent should clearly indicate it's in demo mode

### 02.setup-mastra-agent.md

Phase: Create a real Mastra agent with helpers.

Steps:
- Dynamically import: `const { createMastraHelpers } = await import('@powerhousedao/ph-clint/mastra')`
- Dynamically import: `const { Agent } = await import('@mastra/core/agent')`
- Create helpers: `const m = createMastraHelpers(ctx)`
- Get tools: `await m.getTools()` — converts CLI commands to Mastra tools
- Create workspace: `await m.createWorkspace()` — LocalFilesystem rooted at workdir
- Create memory: `await m.createMemory()` — LibSQL at `{workdir}/.ph/{cliName}/.mastra/db/mastra.db`
- Get instructions: `m.getAgentInstructions('agent-id')` — if using prompts/agent profiles
- Create Agent instance with model, tools, workspace, memory, instructions
- Wrap: `return m.wrapAgent(agent, { maxSteps: 30 })`

### 03.add-mcp-discovery.md

Phase: Enable MCP tool discovery from running services.

Steps:
- Ensure services have `type: 'api-mcp'` in readiness captures
- Import MCPClient: `const { MCPClient } = await import('@mastra/mcp')`
- Pass to getTools: `await m.getTools({ MCPClient })`
- Tools from MCP are prefixed: `{serviceId}-mcp__toolName`
- MCP connections are cached — `disconnectAllMcp()` on shutdown
- Test: start service, verify MCP tools appear in agent's tool list

### 04.add-conversation-logging.md

Phase: Optional — log agent conversations to markdown files.

Steps:
- Import `MarkdownConversationLogger` and `loggedStream` from `ph-clint/mastra`
- Create logger: `new MarkdownConversationLogger({ directory: logDir })`
- Start session: `logger.startSession(sessionId, agentId, agentName, systemPrompt)`
- Wrap stream: `const logged = loggedStream(agentStream, logger, sessionId)`
- End session: `logger.endSession(sessionId)` — writes summary with duration and counts
- Log files written to `{directory}/{agentName}/{YYYYMMDD_HHMM_NNN}.md`

## Research Before Writing

| What | Where |
|------|-------|
| `AgentProvider`, `AgentSetupContext` | `packages/ph-clint/src/core/types.ts` (search `AgentProvider`, `AgentSetupContext`) |
| `StreamChunk` type | `packages/ph-clint/src/core/types.ts` (search `StreamChunk`) |
| `configureAgent` on Cli | `packages/ph-clint/src/core/cli.ts` (search `configureAgent`) |
| Agent loader invocation | `packages/ph-clint/src/core/cli.ts` — search for where the loader is called |
| MastraHelpers implementation | `packages/ph-clint/src/integrations/mastra/index.ts` |
| MastraHelpers types | `packages/ph-clint/src/integrations/mastra/types.ts` |
| MCP discovery | `packages/ph-clint/src/integrations/mastra/mcp.ts` |
| Conversation logger | `packages/ph-clint/src/integrations/mastra/logger.ts` |
| Stream formatting | `packages/ph-clint/src/core/stream.ts` |
| Mastra barrel export | `packages/ph-clint/src/integrations/mastra/index.ts` |
| Example 04 (agent basics) | `examples/04-chat-assistant/src/cli.ts` — agent loader setup |
| Example 05 (MCP + logging) | `examples/05-ph-rupert/src/cli.ts` — full agent with MCP discovery |
| HTML docs section | `packages/ph-clint/docs/index.html` — "AI Agent Integration" and "Streaming Output" sections |
