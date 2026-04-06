import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fusionProjectsManager } from '../../project-managers/instances.js';
import type { RunFusionProjectOptions } from '../../project-managers/FusionProjectsManager.js';

export const initFusionProject = createTool({
  id: 'init-fusion-project',
  description: 'Initialize a new Fusion front-end project by cloning the boilerplate',
  inputSchema: z.object({
    projectName: z
      .string()
      .regex(/^[a-zA-Z0-9-_]+$/)
      .describe('Project name (alphanumeric, hyphens, underscores)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    projectPath: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ projectName }) => {
    const result = await fusionProjectsManager.init(projectName);
    return {
      success: result.success,
      projectPath: result.projectPath || undefined,
      message: result.success
        ? `Fusion project ${projectName} initialized successfully at ${result.projectPath}`
        : result.error || `Failed to initialize Fusion project ${projectName}`,
    };
  },
});

export const listFusionProjects = createTool({
  id: 'list-fusion-projects',
  description: 'List all available Fusion front-end projects',
  inputSchema: z.object({}),
  outputSchema: z.object({
    projects: z.array(
      z.object({
        name: z.string(),
        path: z.string(),
      }),
    ),
    count: z.number(),
  }),
  execute: async () => {
    const projects = await fusionProjectsManager.listProjects();
    return {
      projects: projects.map((p) => ({ name: p.name, path: p.path })),
      count: projects.length,
    };
  },
});

export const runFusionProject = createTool({
  id: 'run-fusion-project',
  description:
    'Run a Fusion front-end project (starts Next.js dev server) with optional custom port and switchboard URL',
  inputSchema: z.object({
    projectName: z.string().describe('Name of the Fusion project to run'),
    fusionPort: z.number().optional().describe('Custom Next.js port (default: auto from config)'),
    switchboardUrl: z.string().optional().describe('Custom Switchboard URL (default: auto from config)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    projectName: z.string().optional(),
    projectPath: z.string().optional(),
    fusionPort: z.number().optional(),
    switchboardUrl: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ projectName, fusionPort, switchboardUrl }) => {
    const options: RunFusionProjectOptions | undefined =
      fusionPort || switchboardUrl
        ? {
            fusionPort: fusionPort || 8000,
            switchboardUrl: switchboardUrl || 'http://localhost:4001/graphql',
            startupTimeout: 60000,
          }
        : undefined;

    const result = await fusionProjectsManager.runProject(projectName, options);

    return {
      success: result.success,
      projectName: result.projectName,
      projectPath: result.projectPath,
      fusionPort: result.fusionPort,
      switchboardUrl: result.switchboardUrl,
      message: result.success
        ? `Fusion project ${projectName} started successfully on port ${result.fusionPort}`
        : result.error || `Failed to start Fusion project ${projectName}`,
    };
  },
});

export const shutdownFusionProject = createTool({
  id: 'shutdown-fusion-project',
  description: 'Shutdown the currently running Fusion front-end project',
  inputSchema: z.object({
    projectName: z.string().describe('Name of the Fusion project to shutdown'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ projectName }) => {
    const result = await fusionProjectsManager.shutdownProject();
    return {
      success: result.success,
      message: result.success
        ? `Fusion project ${projectName} shut down successfully`
        : result.error || `Failed to shutdown Fusion project ${projectName}`,
    };
  },
});

export const getFusionProjectLogs = createTool({
  id: 'get-fusion-project-logs',
  description: 'Get recent logs from the currently running Fusion project',
  inputSchema: z.object({
    lines: z.number().optional().describe('Number of log lines to retrieve (default: 100)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    logs: z.array(z.string()),
  }),
  execute: async ({ lines }) => {
    const allLogs = fusionProjectsManager.getProjectLogs() || [];
    const logs = lines ? allLogs.slice(-lines) : allLogs;
    return { success: true, logs };
  },
});

export const getFusionProjectStatus = createTool({
  id: 'get-fusion-project-status',
  description: 'Get the current status of the running Fusion project',
  inputSchema: z.object({}),
  outputSchema: z.object({
    running: z.boolean(),
    name: z.string().optional(),
    fusionPort: z.number().optional(),
    switchboardUrl: z.string().optional(),
    isFullyStarted: z.boolean().optional(),
    startedAt: z.string().optional(),
  }),
  execute: async () => {
    const project = fusionProjectsManager.getRunningProject();
    if (!project) {
      return { running: false };
    }
    return {
      running: true,
      name: project.name,
      fusionPort: project.fusionPort,
      switchboardUrl: project.switchboardUrl,
      isFullyStarted: project.isFullyStarted,
      startedAt: project.startedAt.toISOString(),
    };
  },
});

export const isFusionProjectReady = createTool({
  id: 'is-fusion-project-ready',
  description: 'Check if the running Fusion project is fully started and ready for use',
  inputSchema: z.object({}),
  outputSchema: z.object({
    isReady: z.boolean(),
    message: z.string(),
  }),
  execute: async () => {
    const ready = fusionProjectsManager.isProjectReady();
    const project = fusionProjectsManager.getRunningProject();
    return {
      isReady: ready,
      message: ready
        ? `Fusion project ${project?.name} is ready`
        : project
          ? `Fusion project ${project.name} is not ready yet`
          : 'No Fusion project is currently running',
    };
  },
});

export const getFusionProjectsDir = createTool({
  id: 'get-fusion-projects-dir',
  description: 'Get the directory path where Fusion projects are stored',
  inputSchema: z.object({}),
  outputSchema: z.object({
    projectsDirectory: z.string(),
  }),
  execute: async () => {
    return {
      projectsDirectory: fusionProjectsManager.getProjectsDir(),
    };
  },
});
