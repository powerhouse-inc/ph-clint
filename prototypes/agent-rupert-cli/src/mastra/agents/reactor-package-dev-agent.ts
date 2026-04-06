import { Agent } from '@mastra/core/agent';
import { Workspace, LocalFilesystem, LocalSandbox } from '@mastra/core/workspace';
import { Memory } from '@mastra/memory';
import {
  initProject,
  listProjects,
  runProject,
  shutdownProject,
  getProjectLogs,
  getProjectStatus,
  isProjectReady,
  getProjectsDir,
} from '../tools/reactor-tools.js';
import { getReactorMcpTools } from '../tools/reactor-mcp-client.js';
import { reactorConfig, SKILLS_DIR, REACTOR_AGENT_SKILLS } from '../../config/reactor-config.js';
import { reactorPackageDevAgentInstructions } from '../generated/agent-instructions.js';

const reactorWorkspace = new Workspace({
  filesystem: new LocalFilesystem({
    basePath: reactorConfig.workspaceDir,
    allowedPaths: [SKILLS_DIR],
  }),
  sandbox: new LocalSandbox({
    workingDirectory: reactorConfig.workspaceDir,
    timeout: reactorConfig.cliTimeout,
  }),
  skills: REACTOR_AGENT_SKILLS,
});

export const reactorPackageDevAgent = new Agent({
  id: 'reactor-package-dev-agent',
  name: 'Reactor Package Dev Agent',
  model: 'anthropic/claude-haiku-4-5',
  instructions: reactorPackageDevAgentInstructions,
  tools: async () => ({
    initProject,
    listProjects,
    runProject,
    shutdownProject,
    getProjectLogs,
    getProjectStatus,
    isProjectReady,
    getProjectsDir,
    ...(await getReactorMcpTools()),
  }),
  memory: new Memory(),
  workspace: reactorWorkspace,
});
