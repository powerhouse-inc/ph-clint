/**
 * ServiceAnnouncer — posts service status to a central endpoint for
 * network-level service discovery. Debounces rapid status changes and
 * retries once on failure.
 */
import os from 'node:os';
import type {
  Logger,
  ServiceManager,
  ServiceDefinition,
  CaptureDefinition,
  EndpointType,
} from './types.js';

// ── Public types ─────────────────────────────────────────────────

export interface AnnouncedService {
  id: string;
  name: string;
  type: 'api-graphql' | 'api-mcp' | 'website';
  url: string;
  port: string;
  status: string;
}

export interface AnnouncementPayload {
  node: {
    hostname: string;
    type: 'clint';
    clintId: string;
  };
  services: AnnouncedService[];
  reportedAt: string;
}

export interface ServiceAnnouncerOptions {
  cliName: string;
  url: string | undefined;
  token: string | undefined;
  serviceDefinitions: ServiceDefinition[];
  serviceManager: ServiceManager;
  excludePowerhouseServices?: string[];
  excludeCliServices?: string[];
  logger: Logger;
  reactorConfig?: { switchboard?: { enabled: boolean }; connect?: { enabled: boolean } };
  powerhouseEndpoints?: Record<string, string>;
}

// ── Announceable endpoint types ──────────────────────────────────

const ANNOUNCEABLE_TYPES: Set<EndpointType> = new Set(['api-graphql', 'api-mcp', 'website']);

function extractPort(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    if (u.port) return u.port;
    return u.protocol === 'https:' ? '443' : '80';
  } catch {
    return '0';
  }
}

// ── ServiceAnnouncer ─────────────────────────────────────────────

export class ServiceAnnouncer {
  private readonly cliName: string;
  private readonly url: string | undefined;
  private readonly token: string | undefined;
  private readonly serviceDefinitions: ServiceDefinition[];
  private readonly serviceManager: ServiceManager;
  private readonly excludePH: Set<string>;
  private readonly excludeCli: Set<string>;
  private readonly logger: Logger;
  private readonly reactorConfig?: { switchboard?: { enabled: boolean }; connect?: { enabled: boolean } };
  private readonly powerhouseEndpoints?: Record<string, string>;

  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(opts: ServiceAnnouncerOptions) {
    this.cliName = opts.cliName;
    this.url = opts.url;
    this.token = opts.token;
    this.serviceDefinitions = opts.serviceDefinitions;
    this.serviceManager = opts.serviceManager;
    this.excludePH = new Set(opts.excludePowerhouseServices ?? []);
    this.excludeCli = new Set(opts.excludeCliServices ?? []);
    this.logger = opts.logger;
    this.reactorConfig = opts.reactorConfig;
    this.powerhouseEndpoints = opts.powerhouseEndpoints;
  }

  /** Build the full announcement payload from current service state. */
  buildPayload(): AnnouncementPayload {
    const services: AnnouncedService[] = [];

    // 1. Extract from CLI service definitions' readiness captures
    for (const def of this.serviceDefinitions) {
      if (this.excludeCli.has(def.id)) continue;
      const instances = this.serviceManager.list(def.id);

      for (const inst of instances) {
        const captures = this.getCapturesForDef(def);
        for (const [captureName, captureDef] of captures) {
          const captureType = typeof captureDef === 'number'
            ? undefined
            : captureDef.type;
          if (!captureType || !ANNOUNCEABLE_TYPES.has(captureType)) continue;

          const url = inst.endpoints?.[captureName];
          if (!url) continue;
          if (!isValidUrl(url)) {
            this.logger.warn(`Invalid URL for service ${def.id}/${captureName}: ${url}`);
            continue;
          }

          const baseName = `service-${def.id}-${captureName}`;
          const instanceSuffix = instances.length > 1 ? `-${inst.instanceId}` : '';

          services.push({
            id: `${baseName}${instanceSuffix}`,
            name: baseName,
            type: captureType as 'api-graphql' | 'api-mcp' | 'website',
            url,
            port: extractPort(url),
            status: inst.status,
          });
        }
      }
    }

    // 2. Powerhouse built-in services
    if (this.reactorConfig?.switchboard?.enabled) {
      const phEndpoints = this.powerhouseEndpoints ?? {};
      if (!this.excludePH.has('agent-switchboard-graphql')) {
        const url = phEndpoints['switchboard-graphql'];
        if (url && isValidUrl(url)) {
          services.push({
            id: 'agent-switchboard-graphql',
            name: 'agent-switchboard-graphql',
            type: 'api-graphql',
            url,
            port: extractPort(url),
            status: 'ready',
          });
        }
      }
      if (!this.excludePH.has('agent-switchboard-mcp')) {
        const url = phEndpoints['switchboard-mcp'];
        if (url && isValidUrl(url)) {
          services.push({
            id: 'agent-switchboard-mcp',
            name: 'agent-switchboard-mcp',
            type: 'api-mcp',
            url,
            port: extractPort(url),
            status: 'ready',
          });
        }
      }
      if (this.reactorConfig?.connect?.enabled && !this.excludePH.has('agent-studio')) {
        const url = phEndpoints['connect'];
        if (url && isValidUrl(url)) {
          services.push({
            id: 'agent-studio',
            name: 'agent-studio',
            type: 'website',
            url,
            port: extractPort(url),
            status: 'ready',
          });
        }
      }
    }

    return {
      node: {
        hostname: os.hostname(),
        type: 'clint',
        clintId: this.cliName,
      },
      services,
      reportedAt: new Date().toISOString(),
    };
  }

  /** Send announcement immediately. */
  async announce(): Promise<void> {
    if (!this.url) return;

    const payload = this.buildPayload();
    try {
      await this.post(payload);
      this.logger.debug('Service announcement sent successfully');
    } catch (err) {
      this.logger.warn(`Service announcement failed: ${err instanceof Error ? err.message : String(err)}`);
      // Retry once after 5s
      this.retryTimer = setTimeout(async () => {
        try {
          await this.post(payload);
          this.logger.debug('Service announcement retry succeeded');
        } catch (retryErr) {
          this.logger.warn(`Service announcement retry failed: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`);
        }
      }, 5000);
    }
  }

  /** Debounced announcement — batches rapid status changes within 2s. */
  scheduleAnnounce(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.announce().catch(() => {});
    }, 2000);
  }

  /** Clean up timers. */
  dispose(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  // ── Private helpers ──────────────────────────────────────────

  private getCapturesForDef(def: ServiceDefinition): Array<[string, number | CaptureDefinition]> {
    const result: Array<[string, number | CaptureDefinition]> = [];
    if (!def.readiness) return result;

    // Single pattern form
    if (def.readiness.captures) {
      for (const [name, capDef] of Object.entries(def.readiness.captures)) {
        result.push([name, capDef]);
      }
    }

    // Multi-pattern form
    if (def.readiness.patterns) {
      for (const pattern of def.readiness.patterns) {
        if (pattern.captures) {
          for (const [name, capDef] of Object.entries(pattern.captures)) {
            result.push([name, capDef]);
          }
        }
      }
    }

    return result;
  }

  private async post(payload: AnnouncementPayload): Promise<void> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(this.url!, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
