import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

/** Stable anchor: project root derived from this file's location (src/config/). */
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Directory where built Mastra skills (SKILL.md files) are stored. */
export const SKILLS_DIR = path.resolve(PROJECT_ROOT, 'skills');

/** Skill paths scoped to the Reactor Package Dev Agent. */
export const REACTOR_AGENT_SKILLS = [
  path.join(SKILLS_DIR, 'reactor-package-project-management'),
  path.join(SKILLS_DIR, 'document-modeling'),
  path.join(SKILLS_DIR, 'document-editor-creation'),
  path.join(SKILLS_DIR, 'playwright-cli'),
  path.join(SKILLS_DIR, 'handle-stakeholder-message'),
];

/** Skill paths scoped to the Fusion Dev Agent. */
export const FUSION_AGENT_SKILLS = [
  path.join(SKILLS_DIR, 'fusion-development'),
  path.join(SKILLS_DIR, 'fusion-project-management'),
  path.join(SKILLS_DIR, 'reactor-package-project-management'),
  path.join(SKILLS_DIR, 'playwright-cli'),
  path.join(SKILLS_DIR, 'handle-stakeholder-message'),
];

interface ReactorSettings {
  workspacePath?: string;
  reactorPackagesPath?: string;
  fusionProjectsPath?: string;
  vetraConnectPort?: number;
  vetraSwitchboardPort?: number;
  vetraStartupTimeout?: number;
  fusionPort?: number;
  fusionSwitchboardUrl?: string;
  fusionStartupTimeout?: number;
  cliTimeout?: number;
}

/**
 * Layer 1: shipped defaults.
 * Kept in sync with reactor-packages-dev.settings.default.json (which serves
 * as documentation for users creating their own override file).
 */
const defaults: Required<ReactorSettings> = {
  workspacePath: './tmp/projects',
  reactorPackagesPath: 'reactor-packages',
  fusionProjectsPath: 'fusion',
  vetraConnectPort: 5000,
  vetraSwitchboardPort: 6100,
  vetraStartupTimeout: 90000,
  fusionPort: 8000,
  fusionSwitchboardUrl: 'http://localhost:6100/graphql',
  fusionStartupTimeout: 60000,
  cliTimeout: 300000,
};

const SETTINGS_DIR = '.ph-agent';
const SETTINGS_FILE = 'reactor-packages-dev.settings.json';

function loadSettingsFile(): ReactorSettings {
  const settingsPath = path.resolve(PROJECT_ROOT, SETTINGS_DIR, SETTINGS_FILE);
  try {
    const raw = readFileSync(settingsPath, 'utf-8');
    return JSON.parse(raw) as ReactorSettings;
  } catch {
    return {};
  }
}

/**
 * Three-layer config resolution (last wins):
 *   1. reactor-packages-dev.settings.default.json  (shipped defaults)
 *   2. .env / environment variables                 (deployment config)
 *   3. .ph-agent/reactor-packages-dev.settings.json (user override in CWD)
 */
function resolveConfig() {
  const settings = loadSettingsFile();

  const workspacePath = settings.workspacePath
    ?? process.env.WORKSPACE_PATH
    ?? defaults.workspacePath;

  const reactorPackagesPath = settings.reactorPackagesPath
    ?? process.env.REACTOR_PACKAGES_PATH
    ?? defaults.reactorPackagesPath;

  const fusionProjectsPath = settings.fusionProjectsPath
    ?? process.env.FUSION_PROJECTS_PATH
    ?? defaults.fusionProjectsPath;

  const workspaceDir = path.resolve(PROJECT_ROOT, workspacePath);
  const reactorPackagesDir = path.resolve(workspaceDir, reactorPackagesPath);
  const fusionProjectsDir = path.resolve(workspaceDir, fusionProjectsPath);

  const vetraConnectPort = settings.vetraConnectPort
    ?? (process.env.VETRA_CONNECT_PORT ? Number(process.env.VETRA_CONNECT_PORT) : undefined)
    ?? defaults.vetraConnectPort;

  const vetraSwitchboardPort = settings.vetraSwitchboardPort
    ?? (process.env.VETRA_SWITCHBOARD_PORT ? Number(process.env.VETRA_SWITCHBOARD_PORT) : undefined)
    ?? defaults.vetraSwitchboardPort;

  const vetraStartupTimeout = settings.vetraStartupTimeout
    ?? (process.env.VETRA_STARTUP_TIMEOUT ? Number(process.env.VETRA_STARTUP_TIMEOUT) : undefined)
    ?? defaults.vetraStartupTimeout;

  const fusionPort = settings.fusionPort
    ?? (process.env.FUSION_PORT ? Number(process.env.FUSION_PORT) : undefined)
    ?? defaults.fusionPort;

  const fusionSwitchboardUrl = settings.fusionSwitchboardUrl
    ?? process.env.FUSION_SWITCHBOARD_URL
    ?? defaults.fusionSwitchboardUrl;

  const fusionStartupTimeout = settings.fusionStartupTimeout
    ?? (process.env.FUSION_STARTUP_TIMEOUT ? Number(process.env.FUSION_STARTUP_TIMEOUT) : undefined)
    ?? defaults.fusionStartupTimeout;

  const cliTimeout = settings.cliTimeout
    ?? (process.env.CLI_TIMEOUT_MS ? Number(process.env.CLI_TIMEOUT_MS) : undefined)
    ?? defaults.cliTimeout;

  return {
    workspaceDir,
    reactorPackagesDir,
    fusionProjectsDir,
    vetraConnectPort,
    vetraSwitchboardPort,
    vetraStartupTimeout,
    fusionPort,
    fusionSwitchboardUrl,
    fusionStartupTimeout,
    cliTimeout,
  };
}

/** Resolved once at import time. */
export const reactorConfig = resolveConfig();
