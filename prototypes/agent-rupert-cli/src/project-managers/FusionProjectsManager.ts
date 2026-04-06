import path from 'node:path';
import fs from 'node:fs/promises';
import { CLIExecutor } from '../tasks/executors/cli-executor.js';
import { ServiceExecutor } from '../tasks/executors/service-executor.js';
import { type CLITask, type ServiceTask, createCLITask, createServiceTask } from '../tasks/types.js';
import type { ChildProcess } from 'node:child_process';
import { AbstractProjectManager, type InitProjectResult, type BaseRunningProject } from './AbstractProjectManager.js';

interface FusionRuntimeParams {
  fusionUrl: string | null;
  fusionPort: number | null;
}

export interface FusionProjectConfig {
  name: string;
  path: string;
}

export interface RunFusionProjectOptions {
  /** Fusion front-end port (default: 8000) */
  fusionPort: number;
  /** Switchboard URL to serve as back-end */
  switchboardUrl: string;
  /** Timeout in milliseconds to wait for fusion to fully start (default: 60000) */
  startupTimeout: number;
}

export interface RunFusionProjectResult {
  /** Whether the project started successfully */
  success: boolean;
  /** Name of the project */
  projectName: string;
  /** The folder of the project */
  projectPath?: string;
  /** Fusion port the project is running on */
  fusionPort?: number;
  /** Switchboard URL to serve as backend */
  switchboardUrl?: string;
  /** Error message if the operation failed */
  error?: string;
}

export interface RunningFusionProject extends BaseRunningProject {
  /** Fusion port (Next.js) */
  fusionPort: number;
  /** The Switchboard URL */
  switchboardUrl: string;
}

export interface FusionConfig {
  fusionPort: number;
  switchboardUrl: string;
  startupTimeout: number;
}

export class FusionProjectsManager extends AbstractProjectManager<
  FusionProjectConfig,
  RunningFusionProject,
  RunFusionProjectOptions,
  RunFusionProjectResult
> {
  private readonly fusionConfig: FusionConfig;

  constructor(
    projectsDir: string = '../projects/fusion',
    cliExecutor?: CLIExecutor,
    serviceExecutor?: ServiceExecutor,
    fusionConfig?: FusionConfig,
  ) {
    super(projectsDir, cliExecutor, serviceExecutor);
    this.fusionConfig = fusionConfig || {
      fusionPort: 8000,
      switchboardUrl: 'http://localhost:4001/graphql',
      startupTimeout: 60000,
    };
  }

  protected getProjectConfigFile(): string {
    return 'next.config.ts';
  }

  protected createInitTask(projectName: string, projectPath: string): CLITask[] {
    const tasks: CLITask[] = [];

    // Git clone task
    tasks.push(createCLITask({
      title: `Initialize Fusion project: ${projectName}`,
      instructions: `Create a new Fusion project`,
      command: 'git',
      args: ['clone', 'https://github.com/powerhouse-inc/fusion-boilerplate.git', projectName],
      workingDirectory: this.projectsDir,
      environment: { CI: 'true' },
    }));

    // Set project name task
    tasks.push(createCLITask({
      title: `Set project name: ${projectName}`,
      instructions: `Update package.json with project name`,
      command: 'sed',
      args: ['-i', '-e', `s/fusion-boilerplate/${projectName}/g`, './package.json'],
      workingDirectory: projectPath,
      environment: { CI: 'true' },
    }));

    // Install dependencies task
    tasks.push(createCLITask({
      title: `Install dependencies: ${projectName}`,
      instructions: `Install project dependencies`,
      command: 'pnpm',
      args: ['install'],
      workingDirectory: projectPath,
      environment: { CI: 'true' },
    }));

    return tasks;
  }

  protected createRunTask(project: FusionProjectConfig, options: RunFusionProjectOptions): ServiceTask {
    return createServiceTask({
      title: `Run Fusion project: ${project.name}`,
      instructions: `Start Fusion development server for ${project.name}`,
      command: 'pnpm',
      args: ['dev', '-p', String(options.fusionPort)],
      workingDirectory: project.path,
      environment: {
        NODE_ENV: 'development',
        PH_SWITCHBOARD_URL: options.switchboardUrl,
      },
      gracefulShutdown: {
        signal: 'SIGTERM',
        timeout: 10000,
      },
      readiness: {
        patterns: [
          {
            regex: 'Local:\\s*http://localhost:(\\d+)',
            name: 'fusion-port',
            endpoints: [{
              endpointName: 'fusion-url',
              endpointDefaultHostUrl: 'http://localhost',
              endpointCaptureGroup: 1,
              monitorPortReleaseUponTermination: true,
            }],
          },
        ],
        timeout: options.startupTimeout,
      },
    });
  }

  protected extractReadinessParams(event: any): FusionRuntimeParams {
    const fusionUrl = event.handle.endpoints?.get('fusion-url') || null;
    const fusionPort = Number(event.readinessMatches?.get('fusion-port')?.[0] || null);
    return { fusionUrl, fusionPort };
  }

  async init(projectName: string): Promise<InitProjectResult> {
    const validation = this.validateProjectName(projectName);
    if (!validation.valid) {
      return { success: false, projectPath: '', error: validation.error };
    }

    const projectPath = path.join(this.projectsDir, projectName);

    try {
      await this.ensureProjectsDirectory();

      if (await this.checkProjectExists(projectPath)) {
        return {
          success: false,
          projectPath,
          error: `Project '${projectName}' already exists at ${projectPath}`,
        };
      }

      const tasks = this.createInitTask(projectName, projectPath);

      let lastResult;
      for (const task of tasks) {
        lastResult = await this.cliExecutor.execute(task);
        if (lastResult.exitCode !== 0) break;
      }

      if (lastResult && lastResult.exitCode === 0) {
        try {
          await fs.access(projectPath);
          await fs.access(path.join(projectPath, 'package.json'));
          return { success: true, projectPath };
        } catch (error) {
          return {
            success: false,
            projectPath,
            error: `Project created but missing expected files: ${error}`,
          };
        }
      } else {
        const errorMessage = lastResult?.stderr || lastResult?.stdout || 'Unknown error during initialization';
        return { success: false, projectPath, error: `git clone failed: ${errorMessage}` };
      }
    } catch (error) {
      return {
        success: false,
        projectPath,
        error: `Failed to initialize project: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async listProjects(): Promise<FusionProjectConfig[]> {
    const projects: FusionProjectConfig[] = [];

    try {
      await this.ensureProjectsDirectory();
      const entries = await fs.readdir(this.projectsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const projectPath = path.join(this.projectsDir, entry.name);
          const configPath = path.join(projectPath, this.getProjectConfigFile());

          try {
            await fs.access(configPath);
            projects.push({ name: entry.name, path: projectPath });
          } catch {
            // Not a Fusion project, skip
          }
        }
      }
    } catch {
      // Directory doesn't exist or other error
    }

    return projects;
  }

  async runProject(projectName: string, options?: RunFusionProjectOptions): Promise<RunFusionProjectResult> {
    const effectiveOptions: RunFusionProjectOptions = {
      fusionPort: options?.fusionPort || this.fusionConfig.fusionPort,
      switchboardUrl: options?.switchboardUrl || this.fusionConfig.switchboardUrl,
      startupTimeout: options?.startupTimeout || this.fusionConfig.startupTimeout,
    };

    if (this.runningProject) {
      return {
        success: false,
        projectName,
        error: `A project is already running: ${this.runningProject.name}. Please shutdown the current project first.`,
      };
    }

    const fusionPortInUse = await this.isPortInUse(effectiveOptions.fusionPort);
    if (fusionPortInUse) {
      return {
        success: false,
        error: `Port ${effectiveOptions.fusionPort} (Fusion) is already in use. Try a different port or stop the process using it.`,
        projectName,
        ...effectiveOptions,
      };
    }

    const projects = await this.listProjects();
    const project = projects.find(p => p.name === projectName);

    if (!project) {
      return {
        success: false,
        projectName,
        error: `Project '${projectName}' not found in ${this.projectsDir}`,
      };
    }

    const actualFusionPort = effectiveOptions.fusionPort;
    const actualSwitchboardUrl = effectiveOptions.switchboardUrl;

    let readinessTimeoutId: NodeJS.Timeout | null = null;

    try {
      const runTask = this.createRunTask(project, effectiveOptions);

      this.runningProject = {
        name: project.name,
        path: project.path,
        fusionPort: actualFusionPort,
        switchboardUrl: actualSwitchboardUrl,
        startedAt: new Date(),
        logs: [],
        isFullyStarted: false,
      };

      const outputHandler = (event: any) => {
        if (!this.runningProject || event.serviceId !== this.runningProject.serviceHandle?.id) {
          return;
        }

        const data = event.data;
        const logPrefix = event.type === 'stdout' ? '[stdout]' : '[stderr]';
        this.runningProject.logs.push(`${logPrefix} ${data}`);

        const maxLogs = 500;
        if (this.runningProject.logs.length > maxLogs) {
          this.runningProject.logs = this.runningProject.logs.slice(-maxLogs);
        }
      };

      let serviceReadyResolve: ((value: FusionRuntimeParams) => void) | null = null;
      const serviceReadyPromise = new Promise<FusionRuntimeParams>((resolve) => {
        serviceReadyResolve = resolve;

        readinessTimeoutId = setTimeout(() => {
          resolve({ fusionUrl: null, fusionPort: null });
        }, effectiveOptions.startupTimeout);
      });

      const readyHandler = (event: any) => {
        if (event.handle.id === this.runningProject?.serviceHandle?.id) {
          const params = this.extractReadinessParams(event);

          if (params.fusionUrl && this.runningProject) {
            this.runningProject.fusionPort = params.fusionPort || actualFusionPort;
            this.runningProject.isFullyStarted = true;
          }

          if (serviceReadyResolve) {
            if (readinessTimeoutId) {
              clearTimeout(readinessTimeoutId);
              readinessTimeoutId = null;
            }
            serviceReadyResolve(params);
          }
        }
      };

      const bootTimeoutHandler = (event: any) => {
        if (event.handle.id === this.runningProject?.serviceHandle?.id) {
          if (serviceReadyResolve) {
            if (readinessTimeoutId) {
              clearTimeout(readinessTimeoutId);
              readinessTimeoutId = null;
            }
            serviceReadyResolve({ fusionUrl: null, fusionPort: null });
          }
        }
      };

      this.serviceExecutor.on('service-output', outputHandler);
      this.serviceExecutor.once('service-ready', readyHandler);
      this.serviceExecutor.once('boot-timeout', bootTimeoutHandler);

      const serviceHandle = await this.serviceExecutor.start(runTask);
      this.runningProject.serviceHandle = serviceHandle;

      if (serviceHandle.pid && this.runningProject) {
        this.runningProject.process = { pid: serviceHandle.pid } as ChildProcess;
      }

      this.serviceExecutor.once('service-exited', (event) => {
        if (event.handle.id === serviceHandle.id) {
          this.runningProject = null;
          this.serviceExecutor.removeListener('service-output', outputHandler);
          this.serviceExecutor.removeListener('service-ready', readyHandler);
          this.serviceExecutor.removeListener('boot-timeout', bootTimeoutHandler);
        }
      });

      const fusionOutputParams = await serviceReadyPromise;

      return {
        success: true,
        projectName: project.name,
        projectPath: project.path,
        fusionPort: fusionOutputParams.fusionPort || actualFusionPort,
        switchboardUrl: actualSwitchboardUrl,
      };

    } catch (error) {
      if (readinessTimeoutId) {
        clearTimeout(readinessTimeoutId);
      }

      this.runningProject = null;
      return {
        success: false,
        projectName: project.name,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
