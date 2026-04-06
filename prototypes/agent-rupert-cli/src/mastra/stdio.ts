import { MCPServer } from '@mastra/mcp';
import { weatherTool } from './tools/weather-tool.js';

const server = new MCPServer({
  name: 'agent-rupert',
  version: '1.0.0',
  tools: { weatherTool },
});

server.startStdio().catch(error => {
  console.error('Error running MCP server:', error);
  process.exit(1);
});
