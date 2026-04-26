import {
  createDocumentChangeTrigger,
  type WorkItem,
} from '@powerhousedao/ph-clint';
import { markMessageRead } from '@powerhousedao/agent-manager/document-models/agent-inbox';

/**
 * Inbox trigger — fires when a `powerhouse/agent-inbox` document changes.
 *
 * Strategy: scan the inbox for unread Incoming messages and, for each one,
 * emit a `'skill'` work-item that runs the `handle-stakeholder-message`
 * skill against the agent. The skill's prompt templates live under
 * `prompts/skills-tpl/handle-stakeholder-message/` and walk the LLM
 * through categorize → update WBS → reply.
 *
 * The `onSuccess` callback marks the message as read so the trigger
 * doesn't re-emit it. Marking is performed via reactor actions on the
 * agent-inbox document; that wiring is filed as a TODO until the rupert
 * package depends on @powerhousedao/agent-manager creators.
 */
export const inboxChangeTrigger = createDocumentChangeTrigger({
  id: 'inbox-change',
  documentType: 'powerhouse/agent-inbox',
  async onChange(doc, ctx): Promise<WorkItem | null> {
    const reactor = await ctx.reactor();
    if (!reactor) return null;

    // Duck-typed scan — agent-manager state shape: { threads: [{ id, messages: [{ id, flow, read, content }] }] }
    type Msg = { id: string; flow?: string; read?: boolean; content?: string };
    type Thread = { id: string; topic?: string; stakeholder?: string; messages?: Msg[] };
    const state = (doc as { state?: { global?: { threads?: Thread[] } } }).state?.global;
    const threads = state?.threads ?? [];

    for (const thread of threads) {
      for (const message of thread.messages ?? []) {
        if (message.read) continue;
        if (message.flow !== 'Incoming') continue;

        return {
          type: 'skill',
          params: {
            skillId: 'handle-stakeholder-message',
            prompt: message.content ?? '',
            inputs: {
              inboxDocId: (doc as { header?: { id?: string } }).header?.id,
              threadId: thread.id,
              messageId: message.id,
              topic: thread.topic ?? '',
            },
          },
          callbacks: {
            onSuccess: async () => {
              const reactor = await ctx.reactor();
              const inboxId = (doc as { header?: { id?: string } }).header?.id;
              if (!reactor || !inboxId) return;
              try {
                await reactor.client.execute(inboxId, 'main', [
                  markMessageRead({ id: message.id }),
                ]);
                ctx.context.log?.info?.(
                  `[inbox] handled message ${message.id} in thread ${thread.id}`,
                );
              } catch (err) {
                ctx.context.log?.error?.(
                  `[inbox] failed to mark ${message.id} read: ${(err as Error).message}`,
                );
              }
            },
            onFailure: (err) => {
              ctx.context.log?.error?.(
                `[inbox] failed to handle message ${message.id}: ${err.message}`,
              );
            },
          },
        };
      }
    }
    return null;
  },
});
