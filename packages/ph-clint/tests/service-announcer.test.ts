import { describe, it, expect, jest, afterEach, beforeEach } from '@jest/globals';
import http from 'node:http';
import { ServiceAnnouncer } from '../src/core/service-announcer.js';
import type { ServiceAnnouncerOptions } from '../src/core/service-announcer.js';
import type { ServiceManager, ServiceDefinition, ServiceInstanceStatus, Logger } from '../src/core/types.js';

function createMockLogger(): Logger {
  return {
    debug: jest.fn<Logger['debug']>(),
    info: jest.fn<Logger['info']>(),
    warn: jest.fn<Logger['warn']>(),
    error: jest.fn<Logger['error']>(),
    level: 'debug',
  };
}

function createMockServiceManager(instances: ServiceInstanceStatus[] = []): ServiceManager {
  return {
    start: jest.fn<ServiceManager['start']>(),
    stop: jest.fn<ServiceManager['stop']>(),
    list: jest.fn<ServiceManager['list']>().mockReturnValue(instances),
    getDefinition: jest.fn<ServiceManager['getDefinition']>(),
    logs: jest.fn<ServiceManager['logs']>().mockReturnValue(''),
    watchLogs: jest.fn<ServiceManager['watchLogs']>().mockReturnValue(() => {}),
    scanProjects: jest.fn<ServiceManager['scanProjects']>().mockReturnValue([]),
    purgeStoppedInstances: jest.fn<ServiceManager['purgeStoppedInstances']>(),
  };
}

function createDefaults(overrides?: Partial<ServiceAnnouncerOptions>): ServiceAnnouncerOptions {
  return {
    cliName: 'test-cli',
    url: 'http://localhost:9999/announce',
    token: undefined,
    serviceDefinitions: [],
    serviceManager: createMockServiceManager(),
    logger: createMockLogger(),
    ...overrides,
  };
}

describe('ServiceAnnouncer', () => {
  let announcer: ServiceAnnouncer;

  afterEach(() => {
    announcer?.dispose();
  });

  describe('buildPayload', () => {
    it('constructs correct node section', () => {
      announcer = new ServiceAnnouncer(createDefaults());
      const payload = announcer.buildPayload();
      expect(payload.node.type).toBe('clint');
      expect(payload.node.clintId).toBe('test-cli');
      expect(typeof payload.node.hostname).toBe('string');
    });

    it('includes reportedAt as ISO 8601', () => {
      announcer = new ServiceAnnouncer(createDefaults());
      const payload = announcer.buildPayload();
      expect(new Date(payload.reportedAt).toISOString()).toBe(payload.reportedAt);
    });

    it('extracts services from readiness captures with announceable types', () => {
      const def: ServiceDefinition = {
        id: 'reactor-project',
        command: 'node server.js',
        readiness: {
          pattern: /GraphQL at (http:\/\/\S+)/,
          captures: {
            'graphql-api': { group: 1, type: 'api-graphql' },
            'internal-port': 2, // plain number — not announceable
          },
          timeout: 10000,
        },
      };
      const instances: ServiceInstanceStatus[] = [{
        serviceId: 'reactor-project',
        instanceId: 'inst-1',
        name: 'Reactor Project',
        status: 'ready',
        endpoints: {
          'graphql-api': 'http://localhost:3001/graphql',
          'internal-port': '3001',
        },
      }];
      announcer = new ServiceAnnouncer(createDefaults({
        serviceDefinitions: [def],
        serviceManager: createMockServiceManager(instances),
      }));
      const payload = announcer.buildPayload();
      expect(payload.services).toHaveLength(1);
      expect(payload.services[0]).toEqual({
        id: 'service-reactor-project-graphql-api',
        name: 'service-reactor-project-graphql-api',
        type: 'api-graphql',
        url: 'http://localhost:3001/graphql',
        port: '3001',
        status: 'ready',
      });
    });

    it('extracts from multi-pattern readiness', () => {
      const def: ServiceDefinition = {
        id: 'multi-svc',
        command: 'node server.js',
        readiness: {
          patterns: [
            {
              name: 'graphql',
              pattern: /GraphQL at (http:\/\/\S+)/,
              captures: { 'gql': { group: 1, type: 'api-graphql' } },
            },
            {
              name: 'mcp',
              pattern: /MCP at (http:\/\/\S+)/,
              captures: { 'mcp-endpoint': { group: 1, type: 'api-mcp' } },
            },
          ],
          timeout: 10000,
        },
      };
      const instances: ServiceInstanceStatus[] = [{
        serviceId: 'multi-svc',
        instanceId: 'inst-1',
        name: 'Multi',
        status: 'ready',
        endpoints: {
          'gql': 'http://localhost:4000/graphql',
          'mcp-endpoint': 'http://localhost:4001/mcp',
        },
      }];
      announcer = new ServiceAnnouncer(createDefaults({
        serviceDefinitions: [def],
        serviceManager: createMockServiceManager(instances),
      }));
      const payload = announcer.buildPayload();
      expect(payload.services).toHaveLength(2);
      expect(payload.services.map(s => s.type)).toEqual(['api-graphql', 'api-mcp']);
    });

    it('skips services with invalid URLs', () => {
      const def: ServiceDefinition = {
        id: 'bad-url',
        command: 'node server.js',
        readiness: {
          pattern: /at (.*)/,
          captures: { 'api': { group: 1, type: 'api-graphql' } },
          timeout: 10000,
        },
      };
      const logger = createMockLogger();
      const instances: ServiceInstanceStatus[] = [{
        serviceId: 'bad-url',
        instanceId: 'inst-1',
        name: 'Bad',
        status: 'ready',
        endpoints: { 'api': 'not-a-url' },
      }];
      announcer = new ServiceAnnouncer(createDefaults({
        serviceDefinitions: [def],
        serviceManager: createMockServiceManager(instances),
        logger,
      }));
      const payload = announcer.buildPayload();
      expect(payload.services).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('extracts correct port from explicit port', () => {
      const def: ServiceDefinition = {
        id: 'svc',
        command: 'cmd',
        readiness: {
          pattern: /at (.*)/,
          captures: { 'api': { group: 1, type: 'website' } },
          timeout: 10000,
        },
      };
      const instances: ServiceInstanceStatus[] = [{
        serviceId: 'svc',
        instanceId: 'i1',
        name: 'Svc',
        status: 'ready',
        endpoints: { 'api': 'http://localhost:8080/app' },
      }];
      announcer = new ServiceAnnouncer(createDefaults({
        serviceDefinitions: [def],
        serviceManager: createMockServiceManager(instances),
      }));
      expect(announcer.buildPayload().services[0]!.port).toBe('8080');
    });

    it('defaults port 80 for http without explicit port', () => {
      const def: ServiceDefinition = {
        id: 'svc',
        command: 'cmd',
        readiness: {
          pattern: /at (.*)/,
          captures: { 'api': { group: 1, type: 'website' } },
          timeout: 10000,
        },
      };
      const instances: ServiceInstanceStatus[] = [{
        serviceId: 'svc',
        instanceId: 'i1',
        name: 'Svc',
        status: 'ready',
        endpoints: { 'api': 'http://example.com/app' },
      }];
      announcer = new ServiceAnnouncer(createDefaults({
        serviceDefinitions: [def],
        serviceManager: createMockServiceManager(instances),
      }));
      expect(announcer.buildPayload().services[0]!.port).toBe('80');
    });

    it('defaults port 443 for https without explicit port', () => {
      const def: ServiceDefinition = {
        id: 'svc',
        command: 'cmd',
        readiness: {
          pattern: /at (.*)/,
          captures: { 'api': { group: 1, type: 'website' } },
          timeout: 10000,
        },
      };
      const instances: ServiceInstanceStatus[] = [{
        serviceId: 'svc',
        instanceId: 'i1',
        name: 'Svc',
        status: 'ready',
        endpoints: { 'api': 'https://example.com/app' },
      }];
      announcer = new ServiceAnnouncer(createDefaults({
        serviceDefinitions: [def],
        serviceManager: createMockServiceManager(instances),
      }));
      expect(announcer.buildPayload().services[0]!.port).toBe('443');
    });

    it('filters excluded CLI services', () => {
      const def: ServiceDefinition = {
        id: 'excluded-svc',
        command: 'cmd',
        readiness: {
          pattern: /at (.*)/,
          captures: { 'api': { group: 1, type: 'api-graphql' } },
          timeout: 10000,
        },
      };
      const instances: ServiceInstanceStatus[] = [{
        serviceId: 'excluded-svc',
        instanceId: 'i1',
        name: 'Excluded',
        status: 'ready',
        endpoints: { 'api': 'http://localhost:3000/graphql' },
      }];
      announcer = new ServiceAnnouncer(createDefaults({
        serviceDefinitions: [def],
        serviceManager: createMockServiceManager(instances),
        excludeCliServices: ['excluded-svc'],
      }));
      expect(announcer.buildPayload().services).toHaveLength(0);
    });

    it('includes Powerhouse switchboard services when configured', () => {
      announcer = new ServiceAnnouncer(createDefaults({
        reactorConfig: { switchboard: { enabled: true }, connect: { enabled: false } },
        powerhouseEndpoints: {
          'switchboard-graphql': 'http://localhost:4001/graphql',
          'switchboard-mcp': 'http://localhost:4001/mcp',
        },
      }));
      const payload = announcer.buildPayload();
      expect(payload.services).toHaveLength(2);
      expect(payload.services.find(s => s.id === 'agent-switchboard-graphql')).toBeDefined();
      expect(payload.services.find(s => s.id === 'agent-switchboard-mcp')).toBeDefined();
    });

    it('includes Connect studio when connect enabled', () => {
      announcer = new ServiceAnnouncer(createDefaults({
        reactorConfig: { switchboard: { enabled: true }, connect: { enabled: true } },
        powerhouseEndpoints: {
          'switchboard-graphql': 'http://localhost:4001/graphql',
          'switchboard-mcp': 'http://localhost:4001/mcp',
          'connect': 'http://localhost:3000',
        },
      }));
      const payload = announcer.buildPayload();
      const studio = payload.services.find(s => s.id === 'agent-studio');
      expect(studio).toBeDefined();
      expect(studio!.type).toBe('website');
    });

    it('includes Powerhouse services after setPowerhouseConfig', () => {
      announcer = new ServiceAnnouncer(createDefaults());
      // Initially no Powerhouse services
      expect(announcer.buildPayload().services).toHaveLength(0);

      // Simulate switchboard becoming ready
      announcer.setPowerhouseConfig(
        { switchboard: { enabled: true }, connect: { enabled: false } },
        {
          'switchboard-graphql': 'http://localhost:5000/graphql',
          'switchboard-mcp': 'http://localhost:5000/mcp',
        },
      );
      const payload = announcer.buildPayload();
      expect(payload.services).toHaveLength(2);
      expect(payload.services.find(s => s.id === 'agent-switchboard-graphql')!.url)
        .toBe('http://localhost:5000/graphql');
      expect(payload.services.find(s => s.id === 'agent-switchboard-mcp')!.url)
        .toBe('http://localhost:5000/mcp');
    });

    it('filters excluded Powerhouse services', () => {
      announcer = new ServiceAnnouncer(createDefaults({
        reactorConfig: { switchboard: { enabled: true } },
        powerhouseEndpoints: {
          'switchboard-graphql': 'http://localhost:4001/graphql',
          'switchboard-mcp': 'http://localhost:4001/mcp',
        },
        excludePowerhouseServices: ['agent-switchboard-graphql'],
      }));
      const payload = announcer.buildPayload();
      expect(payload.services.find(s => s.id === 'agent-switchboard-graphql')).toBeUndefined();
      expect(payload.services.find(s => s.id === 'agent-switchboard-mcp')).toBeDefined();
    });
  });

  describe('announce', () => {
    it('does not POST when URL is not set', async () => {
      announcer = new ServiceAnnouncer(createDefaults({ url: undefined }));
      // Should not throw
      await announcer.announce();
    });

    it('POSTs payload to configured URL', async () => {
      const received: string[] = [];
      const server = http.createServer((req, res) => {
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          received.push(body);
          res.writeHead(200);
          res.end();
        });
      });
      await new Promise<void>(resolve => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        announcer = new ServiceAnnouncer(createDefaults({
          url: `http://localhost:${port}/announce`,
          token: 'test-token',
        }));
        await announcer.announce();

        expect(received).toHaveLength(1);
        const payload = JSON.parse(received[0]!);
        expect(payload.node.clintId).toBe('test-cli');
        expect(payload.node.type).toBe('clint');
      } finally {
        server.close();
      }
    });

    it('logs warning on HTTP failure without throwing', async () => {
      const server = http.createServer((_req, res) => {
        res.writeHead(500);
        res.end('Internal Server Error');
      });
      await new Promise<void>(resolve => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;
      const logger = createMockLogger();

      try {
        announcer = new ServiceAnnouncer(createDefaults({
          url: `http://localhost:${port}/announce`,
          logger,
        }));
        await announcer.announce();
        expect(logger.warn).toHaveBeenCalled();
      } finally {
        server.close();
      }
    });
  });

  describe('scheduleAnnounce', () => {
    it('debounces multiple rapid calls', async () => {
      let callCount = 0;
      const server = http.createServer((_req, res) => {
        callCount++;
        res.writeHead(200);
        res.end();
      });
      await new Promise<void>(resolve => server.listen(0, resolve));
      const port = (server.address() as { port: number }).port;

      try {
        announcer = new ServiceAnnouncer(createDefaults({
          url: `http://localhost:${port}/announce`,
        }));

        // Fire 5 rapid calls
        announcer.scheduleAnnounce();
        announcer.scheduleAnnounce();
        announcer.scheduleAnnounce();
        announcer.scheduleAnnounce();
        announcer.scheduleAnnounce();

        // Wait for debounce (2s) + a bit
        await new Promise(resolve => setTimeout(resolve, 2500));

        expect(callCount).toBe(1);
      } finally {
        server.close();
      }
    }, 10000);
  });

  describe('dispose', () => {
    it('clears timers without error', () => {
      announcer = new ServiceAnnouncer(createDefaults());
      announcer.scheduleAnnounce();
      expect(() => announcer.dispose()).not.toThrow();
    });
  });
});
