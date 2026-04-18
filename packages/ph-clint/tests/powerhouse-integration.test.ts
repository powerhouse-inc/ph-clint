import { describe, it, expect, jest } from '@jest/globals';
import { connectServiceDefinition } from '../src/integrations/powerhouse/connect.js';
import { bridgeSubscriptions } from '../src/integrations/powerhouse/subscriptions.js';
import { ensureDrive } from '../src/integrations/powerhouse/drive.js';
import { buildDefaultReactor } from '../src/integrations/powerhouse/index.js';
import { defineRegistry } from '../src/integrations/powerhouse/registry.js';
import type { ReactorContext, ReactorClientModule } from '../src/integrations/powerhouse/types.js';

describe('connectServiceDefinition', () => {
  it('creates a service definition with correct id and name', () => {
    const svc = connectServiceDefinition({ enabled: true, port: 3000, name: 'test-connect' });
    expect(svc.id).toBe('test-connect');
    expect(svc.name).toBe('test-connect');
    expect(svc.description).toBe('Powerhouse Connect web interface');
  });

  it('generates command string with port and driveUrl', () => {
    const svc = connectServiceDefinition({ enabled: true, port: 3001, name: 'test-connect' });
    const cmd = typeof svc.command === 'function'
      ? svc.command({ port: 3001, driveUrl: 'http://localhost:4001/d/abc' })
      : svc.command;
    expect(cmd).toContain('--port 3001');
    expect(cmd).toContain('--default-drives-url http://localhost:4001/d/abc');
  });

  it('uses stamped port when no params override', () => {
    const svc = connectServiceDefinition({ enabled: true, port: 4500, name: 'my-connect' });
    const cmd = typeof svc.command === 'function'
      ? svc.command({ driveUrl: 'http://test' })
      : svc.command;
    expect(cmd).toContain('--port 4500');
  });

  it('sets env vars for Connect', () => {
    const svc = connectServiceDefinition({ enabled: true, port: 3000, name: 'test-connect' });
    const env = svc.env?.({}, { driveUrl: 'http://localhost:4001/d/abc' });
    expect(env).toEqual({
      PH_CONNECT_DEFAULT_DRIVES_URL: 'http://localhost:4001/d/abc',
      PH_CONNECT_DRIVES_PRESERVE_STRATEGY: 'preserve-all',
    });
  });

  it('has readiness patterns for Connect', () => {
    const svc = connectServiceDefinition({ enabled: true, port: 3000, name: 'test-connect' });
    expect(svc.readiness?.patterns).toHaveLength(1);
    expect(svc.readiness?.patterns?.[0].name).toBe('connect');
    expect(svc.readiness?.timeout).toBe(30_000);
  });

  it('has SIGTERM shutdown config', () => {
    const svc = connectServiceDefinition({ enabled: true, port: 3000, name: 'test-connect' });
    expect(svc.shutdown?.signal).toBe('SIGTERM');
    expect(svc.shutdown?.timeout).toBe(5_000);
  });

  it('has restart disabled', () => {
    const svc = connectServiceDefinition({ enabled: true, port: 3000, name: 'test-connect' });
    expect(svc.restart?.enabled).toBe(false);
  });
});

describe('bridgeSubscriptions', () => {
  it('maps Created events to powerhouse:document:created', () => {
    const emitted: Array<{ event: string; data: unknown }> = [];
    const emit = (event: string, data?: unknown) => emitted.push({ event, data });

    const mockClient = {
      subscribe: (search: any, callback: any) => {
        // Simulate a Created event
        callback({
          type: 'created',
          documents: [
            { header: { id: 'doc-1', documentType: 'conversation' } },
            { header: { id: 'doc-2', documentType: 'task' } },
          ],
        });
        return () => {};
      },
    };

    bridgeSubscriptions(mockClient as any, { documentTypes: ['conversation'] }, emit);
    expect(emitted).toHaveLength(2);
    expect(emitted[0]).toEqual({
      event: 'powerhouse:document:created',
      data: { documentId: 'doc-1', documentType: 'conversation' },
    });
    expect(emitted[1]).toEqual({
      event: 'powerhouse:document:created',
      data: { documentId: 'doc-2', documentType: 'task' },
    });
  });

  it('maps Updated events to powerhouse:document:changed', () => {
    const emitted: Array<{ event: string; data: unknown }> = [];
    const emit = (event: string, data?: unknown) => emitted.push({ event, data });
    const docs = [{ header: { id: 'doc-1', documentType: 'conversation' } }];

    const mockClient = {
      subscribe: (_search: any, callback: any) => {
        callback({ type: 'updated', documents: docs });
        return () => {};
      },
    };

    bridgeSubscriptions(mockClient as any, {}, emit);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual({
      event: 'powerhouse:document:changed',
      data: { changeType: 'updated', documents: docs },
    });
  });

  it('maps Deleted events to powerhouse:document:deleted', () => {
    const emitted: Array<{ event: string; data: unknown }> = [];
    const emit = (event: string, data?: unknown) => emitted.push({ event, data });

    const mockClient = {
      subscribe: (_search: any, callback: any) => {
        callback({ type: 'deleted', documents: [{ header: { id: 'doc-1' } }] });
        return () => {};
      },
    };

    bridgeSubscriptions(mockClient as any, {}, emit);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual({
      event: 'powerhouse:document:deleted',
      data: { documentId: 'doc-1' },
    });
  });

  it('returns unsubscribe function', () => {
    const unsub = jest.fn();
    const mockClient = {
      subscribe: () => unsub,
    };

    const result = bridgeSubscriptions(mockClient as any, {}, () => {});
    result();
    expect(unsub).toHaveBeenCalled();
  });

  it('passes documentTypes filter to client.subscribe', () => {
    let receivedSearch: any;
    const mockClient = {
      subscribe: (search: any, _callback: any) => {
        receivedSearch = search;
        return () => {};
      },
    };

    bridgeSubscriptions(mockClient as any, { documentTypes: ['conversation', 'task'] }, () => {});
    expect(receivedSearch).toEqual({ documentTypes: ['conversation', 'task'] });
  });

  it('handles errors in the callback without crashing', () => {
    const emit = () => { throw new Error('boom'); };
    const mockClient = {
      subscribe: (_search: any, callback: any) => {
        // Should not throw even though emit throws
        expect(() => {
          callback({ type: 'created', documents: [{ header: { id: 'x', documentType: 't' } }] });
        }).not.toThrow();
        return () => {};
      },
    };

    bridgeSubscriptions(mockClient as any, {}, emit);
  });

  it('handles missing documents array gracefully', () => {
    const emitted: Array<{ event: string; data: unknown }> = [];
    const emit = (event: string, data?: unknown) => emitted.push({ event, data });

    const mockClient = {
      subscribe: (_search: any, callback: any) => {
        // Created event with undefined documents
        callback({ type: 'created' });
        return () => {};
      },
    };

    // Should not throw
    bridgeSubscriptions(mockClient as any, {}, emit);
    expect(emitted).toHaveLength(0);
  });
});

describe('ensureDrive', () => {
  /** Helper to build a mock ReactorClientModule with only the methods ensureDrive uses. */
  function mockModule(overrides: {
    findByType?: ReactorClientModule['reactor']['findByType'];
    createEmpty?: (...args: unknown[]) => Promise<{ header: { id: string } }>;
    rename?: (id: string, name: string) => Promise<void>;
  }): ReactorClientModule {
    return {
      client: {
        createEmpty: overrides.createEmpty ?? (async () => ({ header: { id: 'fallback' } })),
        rename: overrides.rename ?? (async () => {}),
      },
      reactor: {
        findByType: overrides.findByType ?? (async () => ({ results: [] })),
        kill: () => ({ completed: Promise.resolve() }),
      },
    } as unknown as ReactorClientModule;
  }

  it('returns existing drive ID when drives exist', async () => {
    const mod = mockModule({
      findByType: async () => ({
        results: [{ header: { id: 'existing-drive-id' } }],
      }),
    });

    const driveId = await ensureDrive(mod);
    expect(driveId).toBe('existing-drive-id');
  });

  it('creates a new drive when none exist', async () => {
    const mod = mockModule({
      createEmpty: async () => ({ header: { id: 'new-drive-id' } }),
    });

    const driveId = await ensureDrive(mod, { name: 'Test Drive' });
    expect(driveId).toBe('new-drive-id');
  });

  it('renames drive with config name', async () => {
    let renamedWith: { id: string; name: string } | undefined;
    const mod = mockModule({
      createEmpty: async () => ({ header: { id: 'new-id' } }),
      rename: async (id: string, name: string) => { renamedWith = { id, name }; },
    });

    await ensureDrive(mod, { name: 'My Agent' });
    expect(renamedWith?.id).toBe('new-id');
    expect(renamedWith?.name).toBe('My Agent');
  });

  it('uses default name when no config provided', async () => {
    let renamedWith: { id: string; name: string } | undefined;
    const mod = mockModule({
      createEmpty: async () => ({ header: { id: 'new-id' } }),
      rename: async (id: string, name: string) => { renamedWith = { id, name }; },
    });

    await ensureDrive(mod);
    expect(renamedWith?.name).toBe('default');
  });

  it('handles empty results from findByType', async () => {
    const mod = mockModule({
      createEmpty: async () => ({ header: { id: 'new-drive-id' } }),
    });

    const driveId = await ensureDrive(mod);
    expect(driveId).toBe('new-drive-id');
  });
});

describe('ReactorContext type', () => {
  it('has the expected shape', () => {
    const ctx: ReactorContext = {
      client: {} as any,
      driveId: 'test-drive',
      async shutdown() {},
    };
    expect(ctx.driveId).toBe('test-drive');
    expect(ctx.switchboardUrl).toBeUndefined();
    expect(ctx.driveUrl).toBeUndefined();
    expect(ctx.mcpUrl).toBeUndefined();
    expect(ctx.connectUrl).toBeUndefined();
  });

  it('accepts all optional Phase 2+3 fields', () => {
    const ctx: ReactorContext = {
      client: {} as any,
      driveId: 'test',
      switchboardUrl: 'http://localhost:4001/graphql',
      driveUrl: 'http://localhost:4001/d/test',
      mcpUrl: 'http://localhost:4001/mcp',
      connectUrl: 'http://localhost:3000',
      async shutdown() {},
    };
    expect(ctx.switchboardUrl).toBe('http://localhost:4001/graphql');
    expect(ctx.connectUrl).toBe('http://localhost:3000');
  });
});

describe('buildDefaultReactor', () => {
  it('is exported as a function', () => {
    expect(typeof buildDefaultReactor).toBe('function');
  });
});

describe('defineRegistry', () => {
  it('builds a registry keyed by documentModel.global.id', () => {
    const moduleA = {
      documentModel: { global: { id: 'test/a' } },
      actions: {},
    } as unknown as Parameters<typeof defineRegistry>[0][number];
    const moduleB = {
      documentModel: { global: { id: 'test/b' } },
      actions: {},
    } as unknown as Parameters<typeof defineRegistry>[0][number];

    const registry = defineRegistry([moduleA, moduleB] as const);

    expect(Object.keys(registry)).toEqual(['test/a', 'test/b']);
    expect((registry as Record<string, unknown>)['test/a']).toBe(moduleA);
    expect((registry as Record<string, unknown>)['test/b']).toBe(moduleB);
  });

  it('returns an empty registry for an empty tuple', () => {
    const registry = defineRegistry([] as const);
    expect(Object.keys(registry)).toEqual([]);
  });
});
