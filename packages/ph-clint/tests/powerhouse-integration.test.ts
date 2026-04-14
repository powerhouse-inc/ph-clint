import { describe, it, expect, jest } from '@jest/globals';
import { definePowerhouseIntegration } from '../src/integrations/powerhouse/index.js';
import { connectServiceDefinition } from '../src/integrations/powerhouse/connect.js';
import { bridgeSubscriptions } from '../src/integrations/powerhouse/subscriptions.js';
import { ensureDrive } from '../src/integrations/powerhouse/drive.js';
import type { PowerhouseContext } from '../src/integrations/powerhouse/types.js';
import type { CommandContext } from '../src/core/types.js';

describe('definePowerhouseIntegration', () => {
  it('returns an integration with id "powerhouse"', () => {
    const { integration } = definePowerhouseIntegration({
      documentModels: [],
    });
    expect(integration.id).toBe('powerhouse');
    expect(typeof integration.setup).toBe('function');
    expect(typeof integration.teardown).toBe('function');
  });

  it('returns empty services when connect is not enabled', () => {
    const { services } = definePowerhouseIntegration({
      documentModels: [],
    });
    expect(services).toEqual([]);
  });

  it('returns connect service definition when connect is enabled', () => {
    const { services } = definePowerhouseIntegration({
      documentModels: [],
      connect: { enabled: true, port: 3001 },
    });
    expect(services).toHaveLength(1);
    expect(services[0].id).toBe('connect');
    expect(services[0].name).toBe('Connect Studio');
  });

  it('returns connect service with default port when not specified', () => {
    const { services } = definePowerhouseIntegration({
      documentModels: [],
      connect: { enabled: true },
    });
    expect(services).toHaveLength(1);
    // Verify the command generates with default port
    const cmd = typeof services[0].command === 'function'
      ? services[0].command({ port: 3000, driveUrl: 'http://test' })
      : services[0].command;
    expect(cmd).toContain('--port 3000');
  });
});

describe('connectServiceDefinition', () => {
  it('creates a service definition with correct id and name', () => {
    const svc = connectServiceDefinition({ enabled: true, port: 3000 });
    expect(svc.id).toBe('connect');
    expect(svc.name).toBe('Connect Studio');
    expect(svc.description).toBe('Powerhouse Connect web interface');
  });

  it('generates command string with port and driveUrl', () => {
    const svc = connectServiceDefinition({ enabled: true, port: 3001 });
    const cmd = typeof svc.command === 'function'
      ? svc.command({ port: 3001, driveUrl: 'http://localhost:4001/d/abc' })
      : svc.command;
    expect(cmd).toContain('--port 3001');
    expect(cmd).toContain('--default-drives-url http://localhost:4001/d/abc');
  });

  it('uses default port 3000 when not specified', () => {
    const svc = connectServiceDefinition({ enabled: true });
    const cmd = typeof svc.command === 'function'
      ? svc.command({ driveUrl: 'http://test' })
      : svc.command;
    expect(cmd).toContain('--port 3000');
  });

  it('sets env vars for Connect', () => {
    const svc = connectServiceDefinition({ enabled: true });
    const env = svc.env?.({}, { driveUrl: 'http://localhost:4001/d/abc' });
    expect(env).toEqual({
      PH_CONNECT_DEFAULT_DRIVES_URL: 'http://localhost:4001/d/abc',
      PH_CONNECT_DRIVES_PRESERVE_STRATEGY: 'preserve-all',
    });
  });

  it('has readiness patterns for Connect', () => {
    const svc = connectServiceDefinition({ enabled: true });
    expect(svc.readiness?.patterns).toHaveLength(1);
    expect(svc.readiness?.patterns?.[0].name).toBe('connect');
    expect(svc.readiness?.timeout).toBe(30_000);
  });

  it('has SIGTERM shutdown config', () => {
    const svc = connectServiceDefinition({ enabled: true });
    expect(svc.shutdown?.signal).toBe('SIGTERM');
    expect(svc.shutdown?.timeout).toBe(5_000);
  });

  it('has restart disabled', () => {
    const svc = connectServiceDefinition({ enabled: true });
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
          type: 'Created',
          documents: [
            { id: 'doc-1', documentType: 'conversation' },
            { id: 'doc-2', documentType: 'task' },
          ],
        });
        return () => {};
      },
    };

    bridgeSubscriptions(mockClient, { documentTypes: ['conversation'] }, emit);
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
    const docs = [{ id: 'doc-1', documentType: 'conversation' }];

    const mockClient = {
      subscribe: (_search: any, callback: any) => {
        callback({ type: 'Updated', documents: docs });
        return () => {};
      },
    };

    bridgeSubscriptions(mockClient, {}, emit);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual({
      event: 'powerhouse:document:changed',
      data: { changeType: 'Updated', documents: docs },
    });
  });

  it('maps Deleted events to powerhouse:document:deleted', () => {
    const emitted: Array<{ event: string; data: unknown }> = [];
    const emit = (event: string, data?: unknown) => emitted.push({ event, data });

    const mockClient = {
      subscribe: (_search: any, callback: any) => {
        callback({ type: 'Deleted', documents: [{ id: 'doc-1' }] });
        return () => {};
      },
    };

    bridgeSubscriptions(mockClient, {}, emit);
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

    const result = bridgeSubscriptions(mockClient, {}, () => {});
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

    bridgeSubscriptions(mockClient, { documentTypes: ['conversation', 'task'] }, () => {});
    expect(receivedSearch).toEqual({ documentTypes: ['conversation', 'task'] });
  });

  it('handles errors in the callback without crashing', () => {
    const emit = () => { throw new Error('boom'); };
    const mockClient = {
      subscribe: (_search: any, callback: any) => {
        // Should not throw even though emit throws
        expect(() => {
          callback({ type: 'Created', documents: [{ id: 'x', documentType: 't' }] });
        }).not.toThrow();
        return () => {};
      },
    };

    bridgeSubscriptions(mockClient, {}, emit);
  });

  it('handles missing documents array gracefully', () => {
    const emitted: Array<{ event: string; data: unknown }> = [];
    const emit = (event: string, data?: unknown) => emitted.push({ event, data });

    const mockClient = {
      subscribe: (_search: any, callback: any) => {
        // Created event with undefined documents
        callback({ type: 'Created' });
        return () => {};
      },
    };

    // Should not throw
    bridgeSubscriptions(mockClient, {}, emit);
    expect(emitted).toHaveLength(0);
  });
});

describe('ensureDrive', () => {
  it('returns existing drive ID when drives exist', async () => {
    const mockClient = {
      getDrives: async () => ['existing-drive-id'],
    };

    const driveId = await ensureDrive(mockClient);
    expect(driveId).toBe('existing-drive-id');
  });

  it('creates a new drive when none exist', async () => {
    const mockClient = {
      getDrives: async () => [],
      addDrive: async (options: any) => 'new-drive-id',
    };

    const driveId = await ensureDrive(mockClient, { name: 'Test Drive' });
    expect(driveId).toBe('new-drive-id');
  });

  it('passes drive config to addDrive', async () => {
    let receivedOptions: any;
    const mockClient = {
      getDrives: async () => [],
      addDrive: async (options: any) => {
        receivedOptions = options;
        return 'new-id';
      },
    };

    await ensureDrive(mockClient, { name: 'My Agent', icon: 'https://icon.url' });
    expect(receivedOptions.global.name).toBe('My Agent');
    expect(receivedOptions.global.icon).toBe('https://icon.url');
  });

  it('uses default name when no config provided', async () => {
    let receivedOptions: any;
    const mockClient = {
      getDrives: async () => [],
      addDrive: async (options: any) => {
        receivedOptions = options;
        return 'new-id';
      },
    };

    await ensureDrive(mockClient);
    expect(receivedOptions.global.name).toBe('default');
  });

  it('handles null drives list', async () => {
    const mockClient = {
      getDrives: async () => null,
      addDrive: async () => 'new-drive-id',
    };

    const driveId = await ensureDrive(mockClient);
    expect(driveId).toBe('new-drive-id');
  });
});

describe('PowerhouseContext type', () => {
  it('has the expected shape', () => {
    const ctx: PowerhouseContext = {
      client: {},
      driveId: 'test-drive',
    };
    expect(ctx.driveId).toBe('test-drive');
    expect(ctx.switchboardUrl).toBeUndefined();
    expect(ctx.driveUrl).toBeUndefined();
    expect(ctx.mcpUrl).toBeUndefined();
    expect(ctx.connectUrl).toBeUndefined();
  });

  it('accepts all optional Phase 2+3 fields', () => {
    const ctx: PowerhouseContext = {
      client: {},
      driveId: 'test',
      switchboardUrl: 'http://localhost:4001/graphql',
      driveUrl: 'http://localhost:4001/d/test',
      mcpUrl: 'http://localhost:4001/mcp',
      connectUrl: 'http://localhost:3000',
    };
    expect(ctx.switchboardUrl).toBe('http://localhost:4001/graphql');
    expect(ctx.connectUrl).toBe('http://localhost:3000');
  });
});
