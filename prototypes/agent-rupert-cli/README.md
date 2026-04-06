# @powerhousedao/agent-rupert

An AI-powered CLI agent built with [Mastra](https://mastra.ai). Ask questions, get answers — from the terminal, from code, or via MCP.

## Setup

```bash
pnpm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
pnpm build
```

## CLI

```bash
rupert weather London          # one-shot response
rupert weather London -i       # streaming response
rupert weather                 # prompts for a city
rupert hello world             # basic greeting
```

## TypeScript Library

```ts
import { mastra } from '@powerhousedao/agent-rupert/mastra';

const agent = mastra.getAgentById('weather-agent');

// One-shot
const response = await agent.generate('What is the weather in London?');
console.log(response.text);

// Streaming
const stream = await agent.stream('What is the weather in London?');
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

## MCP Server

Expose the agent's tools to MCP-compatible clients (Claude, Cursor, Windsurf, etc.).

### HTTP (default)

```bash
pnpm start:mcp         # http://0.0.0.0:4112/mcp
```

Configure in your MCP client:

```json
{
  "mcpServers": {
    "agent-rupert": {
      "url": "http://localhost:4112/mcp"
    }
  }
}
```

Set `MCP_HOST`, `MCP_PORT`, or `MCP_AUTH_TOKEN` in `.env` to customize binding and auth.

### HTTPS

```bash
pnpm start:mcp:https   # https://0.0.0.0:4112/mcp
```

A self-signed certificate is generated automatically in `certs/` on first run. To use with Claude Code:

```json
{
  "mcpServers": {
    "agent-rupert": {
      "url": "https://localhost:4112/mcp"
    }
  }
}
```

```bash
NODE_EXTRA_CA_CERTS=./certs/localhost-cert.pem claude
```

### Stdio

Configure in your MCP client:

```json
{
  "mcpServers": {
    "agent-rupert": {
      "command": "npx",
      "args": ["-y", "@powerhousedao/agent-rupert-mcp"]
    }
  }
}
```
