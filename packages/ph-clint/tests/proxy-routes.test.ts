import { describe, it, expect } from '@jest/globals';
import {
  buildSwitchboardRoutes,
  buildServiceRoutes,
  isWsEndpointType,
} from '../src/core/proxy-routes.js';
import type { ServiceDefinition, ServiceInstanceStatus } from '../src/core/types.js';

describe('isWsEndpointType', () => {
  it('returns true for api-mcp', () => {
    expect(isWsEndpointType('api-mcp')).toBe(true);
  });

  it('returns false for other types', () => {
    expect(isWsEndpointType('api-rest')).toBe(false);
    expect(isWsEndpointType('api-graphql')).toBe(false);
    expect(isWsEndpointType('website')).toBe(false);
    expect(isWsEndpointType('other')).toBe(false);
  });
});

describe('buildSwitchboardRoutes', () => {
  it('produces 3 routes under /switchboard/', () => {
    const routes = buildSwitchboardRoutes(
      'http://localhost:4001',
      'http://localhost:4002',
    );
    expect(routes).toHaveLength(3);
    expect(routes.map(r => r.prefix)).toEqual([
      '/switchboard/graphql',
      '/switchboard/d/',
      '/switchboard/mcp',
    ]);
  });

  it('sets correct upstream URLs', () => {
    const routes = buildSwitchboardRoutes(
      'http://localhost:4001',
      'http://localhost:4002',
    );
    expect(routes[0].upstream.toString()).toBe('http://localhost:4001/graphql');
    expect(routes[1].upstream.toString()).toBe('http://localhost:4001/d/');
    expect(routes[2].upstream.toString()).toBe('http://localhost:4002/mcp');
  });

  it('only marks MCP route as ws-enabled', () => {
    const routes = buildSwitchboardRoutes(
      'http://localhost:4001',
      'http://localhost:4002',
    );
    expect(routes[0].ws).toBe(false);
    expect(routes[1].ws).toBe(false);
    expect(routes[2].ws).toBe(true);
  });

  it('sets source to switchboard', () => {
    const routes = buildSwitchboardRoutes(
      'http://localhost:4001',
      'http://localhost:4002',
    );
    for (const r of routes) {
      expect(r.source).toBe('switchboard');
    }
  });
});

describe('buildServiceRoutes', () => {
  it('extracts routes from single-pattern captures', () => {
    const def: ServiceDefinition = {
      id: 'my-svc',
      command: 'echo',
      readiness: {
        pattern: /listening on (http:\/\/\S+)/,
        captures: {
          mcp: { group: 1, type: 'api-mcp' },
        },
        timeout: 5000,
      },
    };

    const instance: ServiceInstanceStatus = {
      serviceId: 'my-svc',
      instanceId: 'i1',
      name: 'my-svc',
      status: 'ready',
      endpoints: { mcp: 'http://localhost:3000/mcp' },
    };

    const routes = buildServiceRoutes(def, instance);
    expect(routes).toHaveLength(1);
    expect(routes[0].prefix).toBe('/my-svc/mcp');
    expect(routes[0].upstream.toString()).toBe('http://localhost:3000/mcp');
    expect(routes[0].ws).toBe(true);
    expect(routes[0].source).toBe('service:my-svc');
  });

  it('extracts routes from multi-pattern captures', () => {
    const def: ServiceDefinition = {
      id: 'multi',
      command: 'echo',
      readiness: {
        patterns: [
          {
            name: 'graphql',
            pattern: /GraphQL at (http:\/\/\S+)/,
            captures: { gql: { group: 1, type: 'api-graphql' } },
          },
          {
            name: 'mcp',
            pattern: /MCP at (http:\/\/\S+)/,
            captures: { mcp: { group: 1, type: 'api-mcp' } },
          },
        ],
        timeout: 5000,
      },
    };

    const instance: ServiceInstanceStatus = {
      serviceId: 'multi',
      instanceId: 'i1',
      name: 'multi',
      status: 'ready',
      endpoints: {
        gql: 'http://localhost:4001/graphql',
        mcp: 'http://localhost:4002/mcp',
      },
    };

    const routes = buildServiceRoutes(def, instance);
    expect(routes).toHaveLength(2);
    expect(routes.map(r => r.prefix)).toEqual(['/multi/gql', '/multi/mcp']);
  });

  it('skips captures without endpoint type', () => {
    const def: ServiceDefinition = {
      id: 'svc',
      command: 'echo',
      readiness: {
        pattern: /listening on (http:\/\/\S+)/,
        captures: { url: 1 }, // plain number, no type
        timeout: 5000,
      },
    };

    const instance: ServiceInstanceStatus = {
      serviceId: 'svc',
      instanceId: 'i1',
      name: 'svc',
      status: 'ready',
      endpoints: { url: 'http://localhost:3000' },
    };

    const routes = buildServiceRoutes(def, instance);
    expect(routes).toHaveLength(0);
  });

  it('skips captures with missing endpoint URL', () => {
    const def: ServiceDefinition = {
      id: 'svc',
      command: 'echo',
      readiness: {
        pattern: /listening on (http:\/\/\S+)/,
        captures: { mcp: { group: 1, type: 'api-mcp' } },
        timeout: 5000,
      },
    };

    const instance: ServiceInstanceStatus = {
      serviceId: 'svc',
      instanceId: 'i1',
      name: 'svc',
      status: 'ready',
      endpoints: {}, // missing mcp endpoint
    };

    const routes = buildServiceRoutes(def, instance);
    expect(routes).toHaveLength(0);
  });

  it('returns empty array for service without readiness', () => {
    const def: ServiceDefinition = {
      id: 'svc',
      command: 'echo',
    };

    const instance: ServiceInstanceStatus = {
      serviceId: 'svc',
      instanceId: 'i1',
      name: 'svc',
      status: 'ready',
    };

    const routes = buildServiceRoutes(def, instance);
    expect(routes).toHaveLength(0);
  });
});
