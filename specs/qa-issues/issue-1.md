Issue: Agent MCP tools are not connected — the document modeling workflow cannot complete

  Expected behavior: After vetra-start succeeds and the readiness pattern captures the mcp-server endpoint URL, the agent should automatically gain access to reactor_mcp__* tools
  (e.g. reactor_mcp__list_documents, reactor_mcp__getDocumentModelSchema, reactor_mcp__addActions). These tools are required for the agent to create document model specifications
  in the vetra drive.

  Current behavior: The agent is created with only static CLI command tools at src/agents/agent-rupert.ts:77 (tools: cliTools). The connectMcp() function exists in
  src/mcp/client.ts and is fully implemented, but it is never called anywhere. The vetra service correctly captures the MCP server URL via its readiness pattern at
  src/cli.ts:50-52, but this URL is never passed to connectMcp(). When the agent attempts to call reactor_mcp__list_documents, the call produces no output and the agent enters a
  confusion loop — retrying the MCP call, re-exploring files, and trying to restart vetra repeatedly.

  Suggested fix based on codebase analysis:

  1. In src/agents/agent-rupert.ts, change line 77 from static tools to dynamic tool resolution:
  tools: async () => ({
    ...cliTools,
    ...(await getMcpTools()),
  }),
  1. Import getMcpTools from ../mcp/client.js.
  2. Add a mechanism to call connectMcp(mcpServerUrl) when the vetra service becomes ready. The service:ready event in src/cli.ts:109 already fires with event.endpoints containing
  the mcp-server URL — this is the natural hook point. The exact integration depends on how ph-clint exposes service events to the agent context.

  The prototype at ph-clint/prototypes/agent-rupert-cli/src/mastra/agents/reactor-package-dev-agent.ts (lines 35-44) demonstrates the working pattern: it uses async () => ({
  ...staticTools, ...(await getReactorMcpTools()) }) and calls connectReactorMcp(result.mcpServer) when the project starts.
