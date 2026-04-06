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
import {
  initFusionProject,
  listFusionProjects,
  runFusionProject,
  shutdownFusionProject,
  getFusionProjectLogs,
  getFusionProjectStatus,
  isFusionProjectReady,
  getFusionProjectsDir,
} from '../tools/fusion-tools.js';
import { getReactorMcpTools } from '../tools/reactor-mcp-client.js';
import { reactorConfig, SKILLS_DIR, FUSION_AGENT_SKILLS } from '../../config/reactor-config.js';
import { fusionDevAgentInstructions } from '../generated/agent-instructions.js';

const fusionWorkspace = new Workspace({
  filesystem: new LocalFilesystem({
    basePath: reactorConfig.workspaceDir,
    allowedPaths: [SKILLS_DIR],
  }),
  sandbox: new LocalSandbox({
    workingDirectory: reactorConfig.workspaceDir,
    timeout: reactorConfig.cliTimeout,
  }),
  skills: FUSION_AGENT_SKILLS,
});

export const fusionDevAgent = new Agent({
  id: 'fusion-dev-agent',
  name: 'Fusion Dev Agent',
  model: 'anthropic/claude-haiku-4-5',
  instructions: fusionDevAgentInstructions,
  tools: async () => ({
    // Reactor tools needed for managing the Switchboard backend
    initProject,
    listProjects,
    runProject,
    shutdownProject,
    getProjectLogs,
    getProjectStatus,
    isProjectReady,
    getProjectsDir,
    // Fusion-specific project management tools
    initFusionProject,
    listFusionProjects,
    runFusionProject,
    shutdownFusionProject,
    getFusionProjectLogs,
    getFusionProjectStatus,
    isFusionProjectReady,
    getFusionProjectsDir,
    ...(await getReactorMcpTools()),
  }),
  memory: new Memory(),
  workspace: fusionWorkspace,
});
