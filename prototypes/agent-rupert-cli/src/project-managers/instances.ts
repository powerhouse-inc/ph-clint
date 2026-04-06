import { CLIExecutor } from '../tasks/executors/cli-executor.js';
import { ReactorPackagesManager } from './ReactorPackagesManager.js';
import { FusionProjectsManager } from './FusionProjectsManager.js';
import { reactorConfig } from '../config/reactor-config.js';

export const reactorPackagesManager = new ReactorPackagesManager(
  reactorConfig.reactorPackagesDir,
  new CLIExecutor({ timeout: reactorConfig.cliTimeout, retryAttempts: 1 }),
  undefined, // uses default ServiceExecutor
  {
    connectPort: reactorConfig.vetraConnectPort,
    switchboardPort: reactorConfig.vetraSwitchboardPort,
    startupTimeout: reactorConfig.vetraStartupTimeout,
  },
);

export const fusionProjectsManager = new FusionProjectsManager(
  reactorConfig.fusionProjectsDir,
  new CLIExecutor({ timeout: reactorConfig.cliTimeout, retryAttempts: 1 }),
  undefined, // uses default ServiceExecutor
  {
    fusionPort: reactorConfig.fusionPort,
    switchboardUrl: reactorConfig.fusionSwitchboardUrl,
    startupTimeout: reactorConfig.fusionStartupTimeout,
  },
);
