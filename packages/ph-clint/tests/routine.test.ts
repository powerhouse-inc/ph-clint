import { describe, it, expect, afterEach } from '@jest/globals';
import { createRoutine } from '../src/core/routine.js';
import { defineTrigger } from '../src/core/trigger.js';
import { defineCommand } from '../src/core/command.js';
import { createMemoryWorkspace } from '../src/core/workspace.js';
import { createEventBus } from '../src/core/events.js';
import { z } from 'zod';
import type { Routine } from '../src/core/types.js';
import {
  TEST_TICK_INTERVAL,
  TEST_IDLE_INTERVAL,
  ROUTINE_ONE_TICK_WAIT,
  ROUTINE_MULTI_TICK_WAIT,
} from './fixtures/timing.js'; // plain JS — avoids rootDir issues

let routine: Routine | undefined;

afterEach(async () => {
  if (routine && routine.status === 'running') {
    await routine.stop();
  }
  routine = undefined;
});

function makeRoutine(overrides: Partial<Parameters<typeof createRoutine>[0]> = {}) {
  return createRoutine({
    triggers: [],
    commands: new Map(),
    tickInterval: TEST_TICK_INTERVAL,
    idleInterval: TEST_IDLE_INTERVAL,
    ...overrides,
  });
}

describe('createRoutine', () => {
  describe('state machine', () => {
    it('starts in init status', () => {
      routine = makeRoutine();
      expect(routine.status).toBe('init');
    });

    it('transitions to running on start()', async () => {
      routine = makeRoutine();
      routine.start();
      await new Promise(r => setTimeout(r, TEST_IDLE_INTERVAL));
      expect(routine.status).toBe('running');
    });

    it('transitions to ready on stop()', async () => {
      routine = makeRoutine();
      routine.start();
      await new Promise(r => setTimeout(r, TEST_IDLE_INTERVAL));
      await routine.stop();
      expect(routine.status).toBe('ready');
    });

    it('can restart after stopping', async () => {
      routine = makeRoutine();
      routine.start();
      await new Promise(r => setTimeout(r, TEST_IDLE_INTERVAL));
      await routine.stop();
      expect(routine.status).toBe('ready');
      routine.start();
      await new Promise(r => setTimeout(r, TEST_IDLE_INTERVAL));
      expect(routine.status).toBe('running');
    });

    it('start() is idempotent when already running', async () => {
      routine = makeRoutine();
      routine.start();
      await new Promise(r => setTimeout(r, TEST_IDLE_INTERVAL));
      routine.start(); // should not throw
      expect(routine.status).toBe('running');
    });

    it('stop() is a no-op when not running', async () => {
      routine = makeRoutine();
      await routine.stop(); // should not throw
      expect(routine.status).toBe('init');
    });
  });

  describe('trigger setup', () => {
    it('calls trigger setup before first poll', async () => {
      let setupCalled = false;
      const trigger = defineTrigger({
        id: 'setup-test',
        type: 'condition',
        setup: async () => { setupCalled = true; },
        poll: async () => null,
      });

      routine = makeRoutine({ triggers: [trigger] });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_ONE_TICK_WAIT));
      await routine.stop();
      expect(setupCalled).toBe(true);
    });

    it('provides state object to trigger context', async () => {
      let stateValue: unknown;
      const trigger = defineTrigger({
        id: 'state-test',
        type: 'condition',
        setup: async (ctx) => { ctx.state.counter = 0; },
        poll: async (ctx) => {
          (ctx.state.counter as number)++;
          stateValue = ctx.state.counter;
          return null;
        },
      });

      routine = makeRoutine({ triggers: [trigger] });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_MULTI_TICK_WAIT));
      await routine.stop();
      expect(typeof stateValue).toBe('number');
      expect(stateValue as number).toBeGreaterThan(0);
    });
  });

  describe('work item execution', () => {
    it('executes function work items', async () => {
      let executed = false;
      let triggerFired = false;

      const trigger = defineTrigger({
        id: 'fn-trigger',
        type: 'condition',
        poll: async () => {
          if (!triggerFired) {
            triggerFired = true;
            return {
              type: 'function' as const,
              params: { fn: async () => { executed = true; } },
            };
          }
          return null;
        },
      });

      routine = makeRoutine({ triggers: [trigger] });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_MULTI_TICK_WAIT));
      await routine.stop();
      expect(executed).toBe(true);
    });

    it('dispatches command work items', async () => {
      let buildCalled = false;
      let triggerFired = false;

      const trigger = defineTrigger({
        id: 'cmd-trigger',
        type: 'condition',
        poll: async () => {
          if (!triggerFired) {
            triggerFired = true;
            return {
              type: 'command' as const,
              params: { commandId: 'build', args: {} },
            };
          }
          return null;
        },
      });

      const buildCmd = defineCommand({
        id: 'build',
        description: 'Build',
        inputSchema: z.object({}),
        execute: async () => { buildCalled = true; return 'ok'; },
      });

      routine = makeRoutine({
        triggers: [trigger],
        commands: new Map([['build', buildCmd]]),
        context: { workspace: createMemoryWorkspace(), config: {} },
      });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_MULTI_TICK_WAIT));
      await routine.stop();
      expect(buildCalled).toBe(true);
    });

    it('calls onSuccess on successful work item', async () => {
      let successCalled = false;
      let triggerFired = false;

      const trigger = defineTrigger({
        id: 'success-trigger',
        type: 'condition',
        poll: async () => {
          if (!triggerFired) {
            triggerFired = true;
            return {
              type: 'function' as const,
              params: { fn: async () => 'result' },
              callbacks: { onSuccess: () => { successCalled = true; } },
            };
          }
          return null;
        },
      });

      routine = makeRoutine({ triggers: [trigger] });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_MULTI_TICK_WAIT));
      await routine.stop();
      expect(successCalled).toBe(true);
    });

    it('calls onFailure on failed work item', async () => {
      let failureCalled = false;
      let triggerFired = false;

      const trigger = defineTrigger({
        id: 'fail-trigger',
        type: 'condition',
        poll: async () => {
          if (!triggerFired) {
            triggerFired = true;
            return {
              type: 'function' as const,
              params: { fn: async () => { throw new Error('boom'); } },
              callbacks: { onFailure: () => { failureCalled = true; } },
            };
          }
          return null;
        },
      });

      routine = makeRoutine({ triggers: [trigger] });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_MULTI_TICK_WAIT));
      await routine.stop();
      expect(failureCalled).toBe(true);
    });

    it('continues loop after work item failure', async () => {
      let pollCount = 0;

      const trigger = defineTrigger({
        id: 'continue-trigger',
        type: 'condition',
        poll: async () => {
          pollCount++;
          if (pollCount === 1) {
            return {
              type: 'function' as const,
              params: { fn: async () => { throw new Error('fail'); } },
            };
          }
          return null;
        },
      });

      routine = makeRoutine({ triggers: [trigger] });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_MULTI_TICK_WAIT + TEST_TICK_INTERVAL));
      await routine.stop();
      expect(pollCount).toBeGreaterThan(1);
    });
  });

  describe('error handling', () => {
    it('swallows trigger poll errors and continues', async () => {
      let pollCount = 0;
      const trigger = defineTrigger({
        id: 'error-trigger',
        type: 'condition',
        poll: async () => {
          pollCount++;
          if (pollCount === 1) throw new Error('poll error');
          return null;
        },
      });

      routine = makeRoutine({ triggers: [trigger] });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_MULTI_TICK_WAIT));
      await routine.stop();
      expect(pollCount).toBeGreaterThan(1);
    });

    it('reports unknown work item type via onFailure', async () => {
      let failureError: Error | undefined;
      let triggerFired = false;

      const trigger = defineTrigger({
        id: 'bad-type-trigger',
        type: 'condition',
        poll: async () => {
          if (!triggerFired) {
            triggerFired = true;
            return {
              type: 'unknown-type' as any,
              params: {},
              callbacks: {
                onFailure: (err: Error) => { failureError = err; },
              },
            };
          }
          return null;
        },
      });

      routine = makeRoutine({ triggers: [trigger] });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_MULTI_TICK_WAIT));
      await routine.stop();
      expect(failureError?.message).toContain('Unknown work item type');
    });

    it('reports unknown command via onFailure', async () => {
      let failureError: Error | undefined;
      let triggerFired = false;

      const trigger = defineTrigger({
        id: 'bad-cmd-trigger',
        type: 'condition',
        poll: async () => {
          if (!triggerFired) {
            triggerFired = true;
            return {
              type: 'command' as const,
              params: { commandId: 'nonexistent', args: {} },
              callbacks: {
                onFailure: (err: Error) => { failureError = err; },
              },
            };
          }
          return null;
        },
      });

      routine = makeRoutine({ triggers: [trigger] });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_MULTI_TICK_WAIT));
      await routine.stop();
      expect(failureError?.message).toContain('Unknown command');
    });
  });

  describe('config access', () => {
    it('passes config to trigger context', async () => {
      let receivedConfig: Record<string, unknown> = {};

      const trigger = defineTrigger({
        id: 'config-trigger',
        type: 'condition',
        poll: async (ctx) => {
          receivedConfig = ctx.config;
          return null;
        },
      });

      routine = makeRoutine({
        triggers: [trigger],
        context: {
          workspace: createMemoryWorkspace(),
          config: { watchDir: './src' },
        },
      });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_ONE_TICK_WAIT));
      await routine.stop();
      expect(receivedConfig.watchDir).toBe('./src');
    });
  });

  describe('command context enrichment', () => {
    it('provides emit to commands dispatched from routine', async () => {
      let emitFn: unknown;
      let triggerFired = false;
      const bus = createEventBus();

      const trigger = defineTrigger({
        id: 'emit-cmd-trigger',
        type: 'condition',
        poll: async () => {
          if (!triggerFired) {
            triggerFired = true;
            return {
              type: 'command' as const,
              params: { commandId: 'check', args: {} },
            };
          }
          return null;
        },
      });

      const checkCmd = defineCommand({
        id: 'check',
        description: 'Check emit',
        inputSchema: z.object({}),
        execute: async (_, ctx) => {
          emitFn = ctx.emit;
          return 'ok';
        },
      });

      routine = makeRoutine({
        triggers: [trigger],
        commands: new Map([['check', checkCmd]]),
        context: { workspace: createMemoryWorkspace(), config: {} },
        eventBus: bus,
      });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_MULTI_TICK_WAIT));
      await routine.stop();
      expect(typeof emitFn).toBe('function');
    });
  });

  describe('event bus integration', () => {
    it('trigger context emit publishes to shared event bus', async () => {
      const bus = createEventBus();
      let eventReceived = false;
      let triggerFired = false;

      bus.on('test:event', () => { eventReceived = true; });

      const trigger = defineTrigger({
        id: 'emit-trigger',
        type: 'condition',
        poll: async (ctx) => {
          if (!triggerFired) {
            triggerFired = true;
            ctx.emit('test:event', { ok: true });
          }
          return null;
        },
      });

      routine = makeRoutine({
        triggers: [trigger],
        eventBus: bus,
      });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_ONE_TICK_WAIT));
      await routine.stop();
      expect(eventReceived).toBe(true);
    });
  });

  describe('onOutput', () => {
    it('calls onOutput with text from command result objects', async () => {
      const outputLines: string[] = [];
      let triggerOnce = true;

      const trigger = defineTrigger({
        id: 'once',
        type: 'condition',
        poll: async () => {
          if (triggerOnce) {
            triggerOnce = false;
            return { type: 'command' as const, params: { commandId: 'say' } };
          }
          return null;
        },
      });

      const say = defineCommand({
        id: 'say',
        description: 'Say something',
        inputSchema: z.object({}),
        execute: async () => ({ text: 'hello from routine' }),
      });

      routine = makeRoutine({
        triggers: [trigger],
        commands: new Map([['say', say]]),
      });
      routine.onOutput = (text) => outputLines.push(text);

      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_ONE_TICK_WAIT));
      await routine.stop();

      expect(outputLines).toContain('hello from routine');
    });

    it('calls onOutput with stringified non-object results', async () => {
      const outputLines: string[] = [];
      let triggerOnce = true;

      const trigger = defineTrigger({
        id: 'once',
        type: 'condition',
        poll: async () => {
          if (triggerOnce) {
            triggerOnce = false;
            return {
              type: 'function' as const,
              params: { fn: async () => 42 },
            };
          }
          return null;
        },
      });

      routine = makeRoutine({ triggers: [trigger] });
      routine.onOutput = (text) => outputLines.push(text);

      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_ONE_TICK_WAIT));
      await routine.stop();

      expect(outputLines).toContain('42');
    });

    it('does not call onOutput when result is null', async () => {
      const outputLines: string[] = [];
      let triggerOnce = true;

      const trigger = defineTrigger({
        id: 'once',
        type: 'condition',
        poll: async () => {
          if (triggerOnce) {
            triggerOnce = false;
            return {
              type: 'function' as const,
              params: { fn: async () => null },
            };
          }
          return null;
        },
      });

      routine = makeRoutine({ triggers: [trigger] });
      routine.onOutput = (text) => outputLines.push(text);

      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_ONE_TICK_WAIT));
      await routine.stop();

      expect(outputLines).toEqual([]);
    });

    it('does not call onOutput when no callback is set', async () => {
      let triggerOnce = true;

      const trigger = defineTrigger({
        id: 'once',
        type: 'condition',
        poll: async () => {
          if (triggerOnce) {
            triggerOnce = false;
            return {
              type: 'function' as const,
              params: { fn: async () => 'silent' },
            };
          }
          return null;
        },
      });

      // No onOutput set — should not throw
      routine = makeRoutine({ triggers: [trigger] });
      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_ONE_TICK_WAIT));
      await routine.stop();
    });
  });

  describe('setContext', () => {
    it('updates the context used by command execution', async () => {
      let receivedConfig: Record<string, unknown> = {};
      let triggerOnce = true;

      const trigger = defineTrigger({
        id: 'once',
        type: 'condition',
        poll: async () => {
          if (triggerOnce) {
            triggerOnce = false;
            return { type: 'command' as const, params: { commandId: 'check' } };
          }
          return null;
        },
      });

      const check = defineCommand({
        id: 'check',
        description: 'Check config',
        inputSchema: z.object({}),
        execute: async (_, { config }) => {
          receivedConfig = config;
          return null;
        },
      });

      routine = makeRoutine({
        triggers: [trigger],
        commands: new Map([['check', check]]),
      });

      routine.setContext({
        workspace: createMemoryWorkspace(),
        config: { key: 'updated-value' },
      });

      routine.start();
      await new Promise(r => setTimeout(r, ROUTINE_ONE_TICK_WAIT));
      await routine.stop();

      expect(receivedConfig).toEqual({ key: 'updated-value' });
    });
  });
});
