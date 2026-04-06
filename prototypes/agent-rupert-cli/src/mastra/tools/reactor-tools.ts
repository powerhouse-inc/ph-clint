import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { reactorPackagesManager } from '../../project-managers/instances.js';
import type { RunProjectOptions } from '../../project-managers/ReactorPackagesManager.js';
import { connectReactorMcp, disconnectReactorMcp } from './reactor-mcp-client.js';

export const initProject = createTool({
  id: 'init-project',
  description: 'Initialize a new Reactor Package project with the specified name',
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
    const result = await reactorPackagesManager.init(projectName);
    return {
      success: result.success,
      projectPath: result.projectPath || undefined,
      message: result.success
        ? `Project ${projectName} initialized successfully at ${result.projectPath}`
        : result.error || `Failed to initialize project ${projectName}`,
    };
  },
});

export const listProjects = createTool({
  id: 'list-projects',
  description: 'List all available Reactor Package projects and their status',
  inputSchema: z.object({}),
  outputSchema: z.object({
    projects: z.array(
      z.object({
        name: z.string(),
        path: z.string(),
        connectPort: z.number().optional(),
        switchboardPort: z.number().optional(),
      }),
    ),
    count: z.number(),
  }),
  execute: async () => {
    const projects = await reactorPackagesManager.listProjects();
    return {
      projects: projects.map((p) => ({
        name: p.name,
        path: p.path,
        connectPort: p.connectPort,
        switchboardPort: p.switchboardPort,
      })),
      count: projects.length,
    };
  },
});

export const runProject = createTool({
  id: 'run-project',
  description:
    'Run a Reactor Package project (starts Vetra Studio and Switchboard) with optional custom ports',
  inputSchema: z.object({
    projectName: z.string().describe('Name of the project to run'),
    apiPort: z.number().optional().describe('Custom Connect Studio port (default: auto from config)'),
    appPort: z.number().optional().describe('Custom Switchboard port (default: auto from config)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    projectName: z.string().optional(),
    projectPath: z.string().optional(),
    connectPort: z.number().optional(),
    switchboardPort: z.number().optional(),
    driveUrl: z.string().optional(),
    mcpServer: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ projectName, apiPort, appPort }) => {
    const options: RunProjectOptions | undefined =
      apiPort || appPort
        ? {
            connectPort: apiPort || 3000,
            switchboardPort: appPort || 4001,
            startupTimeout: 60000,
          }
        : undefined;

    const result = await reactorPackagesManager.runProject(projectName, options);

    if (result.success && result.mcpServer) {
      await connectReactorMcp(result.mcpServer);
    }

    return {
      success: result.success,
      projectName: result.projectName,
      projectPath: result.projectPath,
      connectPort: result.connectPort,
      switchboardPort: result.switchboardPort,
      driveUrl: result.driveUrl,
      mcpServer: result.mcpServer,
      message: result.success
        ? `Project ${projectName} started successfully. Reactor MCP tools are now available.`
        : result.error || `Failed to start project ${projectName}`,
    };
  },
});

export const shutdownProject = createTool({
  id: 'shutdown-project',
  description: 'Shutdown the currently running Reactor Package project',
  inputSchema: z.object({
    projectName: z.string().describe('Name of the project to shutdown'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ projectName }) => {
    await disconnectReactorMcp();
    const result = await reactorPackagesManager.shutdownProject();
    return {
      success: result.success,
      message: result.success
        ? `Project ${projectName} shut down successfully`
        : result.error || `Failed to shutdown project ${projectName}`,
    };
  },
});

export const getProjectLogs = createTool({
  id: 'get-project-logs',
  description: 'Get recent logs from the currently running Reactor Package project',
  inputSchema: z.object({
    lines: z.number().optional().describe('Number of log lines to retrieve (default: 100)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    logs: z.array(z.string()),
  }),
  execute: async ({ lines }) => {
    const allLogs = reactorPackagesManager.getProjectLogs() || [];
    const logs = lines ? allLogs.slice(-lines) : allLogs;
    return { success: true, logs };
  },
});

export const getProjectStatus = createTool({
  id: 'get-project-status',
  description: 'Get the current status of the running Reactor Package project',
  inputSchema: z.object({}),
  outputSchema: z.object({
    running: z.boolean(),
    name: z.string().optional(),
    connectPort: z.number().optional(),
    switchboardPort: z.number().optional(),
    driveUrl: z.string().optional(),
    mcpServer: z.string().optional(),
    isFullyStarted: z.boolean().optional(),
    startedAt: z.string().optional(),
  }),
  execute: async () => {
    const project = reactorPackagesManager.getRunningProject();
    if (!project) {
      return { running: false };
    }
    return {
      running: true,
      name: project.name,
      connectPort: project.connectPort,
      switchboardPort: project.switchboardPort,
      driveUrl: project.driveUrl,
      mcpServer: project.mcpServer,
      isFullyStarted: project.isFullyStarted,
      startedAt: project.startedAt.toISOString(),
    };
  },
});

export const isProjectReady = createTool({
  id: 'is-project-ready',
  description: 'Check if the running Reactor Package project is fully started and ready for use',
  inputSchema: z.object({}),
  outputSchema: z.object({
    isReady: z.boolean(),
    message: z.string(),
  }),
  execute: async () => {
    const ready = reactorPackagesManager.isProjectReady();
    const project = reactorPackagesManager.getRunningProject();
    return {
      isReady: ready,
      message: ready
        ? `Project ${project?.name} is ready`
        : project
          ? `Project ${project.name} is not ready yet`
          : 'No project is currently running',
    };
  },
});

export const getProjectsDir = createTool({
  id: 'get-projects-dir',
  description: 'Get the directory path where Reactor Package projects are stored',
  inputSchema: z.object({}),
  outputSchema: z.object({
    projectsDirectory: z.string(),
  }),
  execute: async () => {
    return {
      projectsDirectory: reactorPackagesManager.getProjectsDir(),
    };
  },
});
