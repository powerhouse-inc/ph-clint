/**
 * Document change trigger for the connect-agent CLI.
 *
 * Listens for `powerhouse:document:changed` events on the event bus.
 * When a change is detected, produces a work item that invokes the agent
 * to process the new message.
 *
 * Filtering (to prevent infinite loops) is done by the work item function
 * itself, which has access to the full document state.
 */

import type { Trigger, WorkItem, TriggerContext } from 'ph-clint';

export interface DocumentChangeTriggerOptions {
  /** Called when a document change is detected. Should return a work item if the agent should respond, or null to skip. */
  onDocumentChanged: (ctx: TriggerContext) => Promise<WorkItem | null>;
}

/**
 * Create a trigger that fires when agent-chat documents change.
 */
export function createDocumentChangeTrigger(
  options: DocumentChangeTriggerOptions,
): Trigger {
  return {
    id: 'document-change',
    type: 'condition',

    async setup(ctx: TriggerContext) {
      ctx.state.pendingChanges = [] as Array<{ documents: unknown }>;

      ctx.context.on!('powerhouse:document:changed', (data) => {
        console.log('[trigger] Document change event received');
        const pending = ctx.state.pendingChanges as Array<unknown>;
        pending.push(data);
      });

    },

    async poll(ctx: TriggerContext): Promise<WorkItem | null> {
      const pending = ctx.state.pendingChanges as Array<unknown>;
      if (pending.length === 0) return null;

      // Drain the queue — we only need to react once per poll cycle
      pending.length = 0;

      // Delegate to the callback which has full context to inspect
      // the document and decide whether the agent should respond
      return options.onDocumentChanged(ctx);
    },
  };
}
