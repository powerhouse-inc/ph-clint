/**
 * Builds `powerhouse.manifest.json` — a machine-readable manifest describing
 * the CLI project's capabilities for service discovery and deployment.
 */
import {
  type ClintProjectSpec,
  getBinName,
  getAppPackageName,
  phAtLeast,
} from '../../spec/types.js';

interface ManifestAgent {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  models: Array<{ id: string; default: boolean }>;
}

interface ManifestPowerhouse {
  support: 'Reactor' | 'Switchboard' | 'Connect';
  package: string;
}

interface Manifest {
  type: 'clint-project';
  features: {
    agent: ManifestAgent | false;
    powerhouse: ManifestPowerhouse | false;
  };
  serviceCommand: string;
  proxyEnabled: boolean;
  supportedResources: string[];
}

export function buildManifestJson(spec: ClintProjectSpec): string {
  const { mastra, powerhouse } = spec.features;

  const agent: ManifestAgent | false = mastra.enabled
    ? {
        id: mastra.agentId ?? spec.name,
        name: mastra.agentName ?? spec.name,
        description: mastra.agentDescription ?? null,
        image: mastra.agentImage ?? null,
        models: mastra.models.map((m) => ({ id: m.id, default: m.isDefault })),
      }
    : false;

  const ph: ManifestPowerhouse | false = phAtLeast(powerhouse, 'Reactor')
    ? {
        support: powerhouse as 'Reactor' | 'Switchboard' | 'Connect',
        package: getAppPackageName(spec),
      }
    : false;

  const manifest: Manifest = {
    type: 'clint-project',
    features: { agent, powerhouse: ph },
    serviceCommand: getBinName(spec),
    proxyEnabled: spec.deployment.proxyEnabled,
    supportedResources: spec.deployment.supportedResources,
  };

  return JSON.stringify(manifest, null, 2) + '\n';
}
