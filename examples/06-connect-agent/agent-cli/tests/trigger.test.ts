import { describe, it, expect } from '@jest/globals';
import type { TriggerContext, WorkItem } from 'ph-clint';
import { createDocumentChangeTrigger } from '../src/trigger.js';

function makeTriggerContext(): TriggerContext {
  const handlers = new Map<string, Array<(data?: unknown) => void>>();
  return {
    context: {
      workspace: {} as any,
      config: {},
      workdir: '',
      stdout: console.log,
      emit: (event, data) => {
        for (const h of handlers.get(event) ?? []) h(data);
      },
      on: (event, handler) => {
        if (!handlers.has(event)) handlers.set(event, []);
        handlers.get(event)!.push(handler);
      },
    },
    state: {},
    reactor: async () => undefined,
    agent: async () => undefined,
  };
}

describe('createDocumentChangeTrigger', () => {
  it('should have correct id and type', () => {
    const trigger = createDocumentChangeTrigger({
      onDocumentChanged: async () => null,
    });
    expect(trigger.id).toBe('document-change');
    expect(trigger.type).toBe('condition');
  });

  it('should return null from poll when no events received', async () => {
    const trigger = createDocumentChangeTrigger({
      onDocumentChanged: async () => null,
    });
    const ctx = makeTriggerContext();
    await trigger.setup!(ctx);

    const result = await trigger.poll(ctx);
    expect(result).toBeNull();
  });

  it('should call onDocumentChanged when event is received', async () => {
    let called = false;
    const workItem: WorkItem = {
      type: 'function',
      params: { fn: async () => 'done' },
    };
    const trigger = createDocumentChangeTrigger({
      onDocumentChanged: async () => {
        called = true;
        return workItem;
      },
    });
    const ctx = makeTriggerContext();
    await trigger.setup!(ctx);

    // Simulate a document change event
    ctx.context.emit!('powerhouse:document:changed', { changeType: 'Updated', documents: [] });

    const result = await trigger.poll(ctx);
    expect(called).toBe(true);
    expect(result).toBe(workItem);
  });

  it('should drain pending events after poll', async () => {
    let callCount = 0;
    const trigger = createDocumentChangeTrigger({
      onDocumentChanged: async () => {
        callCount++;
        return null;
      },
    });
    const ctx = makeTriggerContext();
    await trigger.setup!(ctx);

    // Multiple events before a single poll
    ctx.context.emit!('powerhouse:document:changed', {});
    ctx.context.emit!('powerhouse:document:changed', {});
    ctx.context.emit!('powerhouse:document:changed', {});

    await trigger.poll(ctx);
    expect(callCount).toBe(1); // Only one callback despite 3 events

    // Next poll without new events — should not call back
    const result = await trigger.poll(ctx);
    expect(result).toBeNull();
    expect(callCount).toBe(1);
  });

  it('should return null when onDocumentChanged returns null', async () => {
    const trigger = createDocumentChangeTrigger({
      onDocumentChanged: async () => null,
    });
    const ctx = makeTriggerContext();
    await trigger.setup!(ctx);

    ctx.context.emit!('powerhouse:document:changed', {});

    const result = await trigger.poll(ctx);
    expect(result).toBeNull();
  });

  it('should not fire for unrelated events', async () => {
    let called = false;
    const trigger = createDocumentChangeTrigger({
      onDocumentChanged: async () => {
        called = true;
        return null;
      },
    });
    const ctx = makeTriggerContext();
    await trigger.setup!(ctx);

    // Different event
    ctx.context.emit!('powerhouse:document:created', { documentId: 'x' });

    const result = await trigger.poll(ctx);
    expect(result).toBeNull();
    expect(called).toBe(false);
  });
});
