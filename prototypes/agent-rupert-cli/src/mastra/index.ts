
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { weatherWorkflow } from './workflows/weather-workflow.js';
import { weatherAgent } from './agents/weather-agent.js';
import { reactorPackageDevAgent } from './agents/reactor-package-dev-agent.js';
import { fusionDevAgent } from './agents/fusion-dev-agent.js';
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(__dirname, '../../mastra-db');

/** Available agent choices for the --agent CLI flag. */
export const agentChoices = ['reactor', 'fusion'] as const;
export type AgentChoice = (typeof agentChoices)[number];

const agentIdMap: Record<AgentChoice, string> = {
  reactor: 'reactor-package-dev-agent',
  fusion: 'fusion-dev-agent',
};

/** The agent that handles unprefixed prompts in interactive mode and CLI. */
export let defaultAgentId = 'reactor-package-dev-agent';

/** Set the active agent by short name. */
export function setDefaultAgent(choice: AgentChoice): void {
  defaultAgentId = agentIdMap[choice];
}

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, reactorPackageDevAgent, fusionDevAgent },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: "mastra-storage",
      url: `file:${path.join(dbDir, 'mastra.db')}`,
    }),
    domains: {
      observability: await new DuckDBStore({ path: path.join(dbDir, 'mastra.duckdb') }).getStore('observability'),
    }
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
