/**
 * Watches chat session documents and invokes the agent when a user message arrives.
 *
 * Flow:
 * 1. Trigger fires on any chat-session document change
 * 2. For each doc, guard: skip unless last message is USER, session is ACTIVE, and not in-flight
 * 3. Lazily initialize session (START_SESSION) if threadId is not set
 * 4. Extract user text from the last message
 * 5. Stream agent response, writing each chunk back to the document
 */
import { createDocumentChangeTrigger, type AgentContentPart, type ReactorContext, type TriggerContext } from '@powerhousedao/ph-clint';
import { ensureSessionInitialized, type ChatSessionRegistry } from './chat-session-init.js';
import { writeAgentStreamToDocument } from './chat-bridge.js';
import { extractAttachments } from './extract-attachments.js';
import type { ChatSessionState, ContentPart, Message } from '@powerhousedao/clint-common/document-models/chat-session';
import { setResponding } from '@powerhousedao/clint-common/document-models/chat-session';

const DOCUMENT_TYPE = 'powerhouse/chat-session' as const;
const TAG = '[chat-session-watch]';

/** Track documents currently being processed to prevent re-entrancy. */
const inFlight = new Set<string>();

/**
 * AbortControllers for in-flight agent streams, keyed by document id. The
 * interrupt listener (below) aborts the matching controller when the user
 * requests an interrupt mid-turn.
 */
const abortControllers = new Map<string, AbortController>();

/** Ensures the document-change listener that watches for interrupts is registered once. */
let interruptListenerRegistered = false;

/**
 * Register a single, process-wide listener for the interrupt signal.
 *
 * The trigger serializes its `onChange` polling, so while a stream is in
 * flight the trigger cannot observe a freshly-dispatched INTERRUPT_AGENT
 * operation until the stream finishes — too late to interrupt. The event bus,
 * however, fires synchronously on every document change regardless of the
 * blocked poll loop, so we subscribe to it directly and abort the in-flight
 * stream the moment `interruptRequested` flips to true.
 */
function ensureInterruptListener(ctx: TriggerContext<{ pending: number }, Record<string, unknown>, ChatSessionRegistry>): void {
  if (interruptListenerRegistered) return;
  const on = ctx.context.on;
  if (!on) return;
  interruptListenerRegistered = true;
  const log = ctx.context.log;

  on('powerhouse:document:changed', (payload) => {
    for (const doc of payload.documents) {
      const documentId = doc.header.id;
      const controller = abortControllers.get(documentId);
      if (!controller || controller.signal.aborted) continue;
      const global = (doc.state as { global?: ChatSessionState }).global;
      if (global?.interruptRequested) {
        log?.info(`${TAG} interrupt requested for ${documentId}, aborting agent stream`);
        controller.abort();
      }
    }
  });
}

export const chatSessionWatchTrigger = createDocumentChangeTrigger<ChatSessionRegistry, 'powerhouse/chat-session'>({
  id: 'chat-session-watch',
  documentType: DOCUMENT_TYPE,

  async onChange(docs, ctx) {
    const log = ctx.context.log;
    const reactor = await ctx.reactor();
    const agent = await ctx.agent();

    if (!reactor || !agent) {
      log?.info(`${TAG} reactor or agent not available, skipping`);
      return null;
    }

    ensureInterruptListener(ctx);

    for (const doc of docs) {
      const documentId = doc.header.id;
      const state = doc.state.global;
      const { status, messages } = state;

      // Guard: skip completed/aborted/error sessions
      if (status === 'COMPLETED' || status === 'ABORTED' || status === 'ERROR') {
        continue;
      }

      // Guard: need at least one message
      if (messages.length === 0) continue;

      const lastMessage: Message = messages[messages.length - 1];

      // Guard: only react to USER messages (prevents re-entrancy from our own writes)
      if (lastMessage.role !== 'USER') continue;

      // Guard: already processing this document
      if (inFlight.has(documentId)) {
        log?.info(`${TAG} ${documentId} already in-flight, skipping`);
        continue;
      }

      // Extract user text from content parts
      const userText = lastMessage.content
        .filter((p: ContentPart) => p.type === 'TEXT' && p.text)
        .map((p: ContentPart) => p.text!)
        .join('\n');

      // Let image/file-only messages through — attachments are resolved below.
      const hasAttachmentParts = lastMessage.content.some((p: ContentPart) => p.type === 'IMAGE' || p.type === 'FILE');

      if (!userText && !hasAttachmentParts) {
        log?.info(`${TAG} ${documentId} user message has no text or attachments, skipping`);
        continue;
      }

      inFlight.add(documentId);
      log?.info(`${TAG} processing ${documentId}: ${userText ? `user said "${userText.slice(0, 80)}..."` : 'attachment-only message'}`);

      try {
        // Lazy session init: assigns threadId if not set
        const threadId = await ensureSessionInitialized(reactor, documentId, state, agent, log);

        // Extract file/image attachments to disk
        const attachments = await extractAttachments(lastMessage, {
          workdir: ctx.context.workdir,
          documentId,
          log,
          service: reactor.attachments,
        });

        // Build multimodal prompt: include images natively so the model
        // can see them, plus file paths so agent tools can read them.
        // Image bytes come from the already-resolved attachments (no second service.get).
        const imageAttachments = attachments.filter((a) => a.partType === 'IMAGE');

        let prompt: string | AgentContentPart[];
        if (imageAttachments.length > 0) {
          const parts: AgentContentPart[] = [];
          for (const a of imageAttachments) {
            parts.push({
              type: 'image',
              image: a.bytes,
              mediaType: a.mediaType ?? undefined,
            });
          }
          let text = userText;
          if (attachments.length > 0) {
            log?.info(`${TAG} extracted ${attachments.length} attachment(s)`);
            const pathList = attachments.map((a) => `- ${a.filename}: ${a.localPath}`).join('\n');
            const note = `[Attached files saved to disk]\n${pathList}`;
            text = text ? `${text}\n\n${note}` : note;
          }
          if (text) parts.push({ type: 'text', text });
          prompt = parts;
        } else if (attachments.length > 0) {
          log?.info(`${TAG} extracted ${attachments.length} attachment(s)`);
          const pathList = attachments.map((a) => `- ${a.filename}: ${a.localPath}`).join('\n');
          const note = `[Attached files saved to disk]\n${pathList}`;
          prompt = userText ? `${userText}\n\n${note}` : note;
        } else {
          prompt = userText;
        }

        // Stream agent response and write to document. The abort signal lets
        // the interrupt listener stop this turn mid-stream; the underlying
        // agent treats an abort as a clean end, so the partial assistant
        // message is preserved and the session stays ACTIVE.
        const abortController = new AbortController();
        abortControllers.set(documentId, abortController);
        // Mark the session as responding so clients can show a stop control.
        await reactor.client.execute<'powerhouse/chat-session'>(documentId, 'main', [setResponding({ responding: true })]);
        const stream = agent.stream(prompt, { threadId, abortSignal: abortController.signal });
        await writeAgentStreamToDocument(stream, {
          reactor,
          documentId,
          log,
        });
      } catch (err) {
        log?.error(`${TAG} agent invocation failed for ${documentId}:`, err);
      } finally {
        abortControllers.delete(documentId);
        inFlight.delete(documentId);
        // Clear the responding flag whether the turn finished or was interrupted.
        await reactor.client.execute<'powerhouse/chat-session'>(documentId, 'main', [setResponding({ responding: false })]).catch((e: unknown) => log?.error(`${TAG} failed to clear responding flag for ${documentId}:`, e));
      }
    }

    return null;
  },
});
