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

interface ManifestObservability {
  enabled: true;
  package: string;
  envVars: {
    sentryDsn: string;
    otelExporterOtlpEndpoint: string;
  };
}

interface Manifest {
  type: 'clint-project';
  features: {
    agent: ManifestAgent | false;
    powerhouse: ManifestPowerhouse | false;
    observability: ManifestObservability | false;
  };
  serviceCommand: string;
  proxyEnabled: boolean;
  supportedResources: string[];
}

/** Convert a kebab-case spec.name like 'foo-bar-cli' into an env-var prefix 'FOO_BAR_CLI'. */
function cliEnvPrefix(specName: string): string {
  return specName.toUpperCase().replace(/-/g, '_');
}

export function buildManifestJson(spec: ClintProjectSpec): string {
  const { mastra, powerhouse } = spec.features;
  const observabilityEnabled = spec.deployment.observabilityEnabled;

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

  const obs: ManifestObservability | false = observabilityEnabled
    ? {
        enabled: true,
        package: '@powerhousedao/ph-clint-observability',
        envVars: {
          sentryDsn: `${cliEnvPrefix(spec.name)}_SENTRY_DSN`,
          otelExporterOtlpEndpoint: `${cliEnvPrefix(spec.name)}_OTEL_EXPORTER_OTLP_ENDPOINT`,
        },
      }
    : false;

  const manifest: Manifest = {
    type: 'clint-project',
    features: { agent, powerhouse: ph, observability: obs },
    serviceCommand: getBinName(spec),
    proxyEnabled: spec.deployment.proxyEnabled,
    supportedResources: spec.deployment.supportedResources,
  };

  return JSON.stringify(manifest, null, 2) + '\n';
}
