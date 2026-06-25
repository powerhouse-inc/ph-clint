/**
 * Watches chat session documents and invokes the agent when a user message arrives.
 *
 * Flow:
 * 1. Trigger fires on any chat-session document change
 * 2. For each doc, guard: skip unless last message is a non-empty USER message,
 *    session is ACTIVE, not in-flight, and no interrupt is pending. Skips write
 *    nothing — they are recomputable from document state on every pass.
 * 3. Lazily initialize session (START_SESSION) if threadId is not set
 * 4. Dispatch the turn DETACHED (runAgentTurn) so the single serialized poll
 *    loop stays responsive and independent sessions stream concurrently on
 *    their own threadIds. The inFlight guard keeps it to one turn per document.
 * 5. The turn extracts user text, streams the agent response chunk-by-chunk
 *    back into the document, and on failure appends an assistant ERROR message
 *    to close the turn.
 */
import { createDocumentChangeTrigger, type AgentContentPart, type TriggerContext, type Logger, type ReactorContext, type AgentProvider } from '@powerhousedao/ph-clint';
import { ensureSessionInitialized, type ChatSessionRegistry } from './chat-session-init.js';
import { writeAgentStreamToDocument, RetryableStreamError } from './chat-bridge.js';
import { extractAttachments } from './extract-attachments.js';
import type { ChatSessionState, ContentPart, Message } from '@powerhousedao/clint-common/document-models/chat-session';
import { addAssistantMessage, hasMessageContent } from '@powerhousedao/clint-common/document-models/chat-session';
import { randomUUID } from 'node:crypto';

const DOCUMENT_TYPE = 'powerhouse/chat-session' as const;
const TAG = '[chat-session-watch]';

const STREAM_MAX_RETRIES = 3;
const STREAM_RETRY_CAP_MS = 30_000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Honor `retry-after`, else exponential backoff with full jitter; capped. */
function streamRetryDelayMs(err: RetryableStreamError, attempt: number): number {
  if (err.retryAfterMs !== undefined) return Math.min(err.retryAfterMs, STREAM_RETRY_CAP_MS);
  const backoff = Math.min(1000 * 2 ** attempt, STREAM_RETRY_CAP_MS);
  return Math.round(Math.random() * backoff);
}

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

/** Ensures the document-created listener is registered once. */
let creationListenerRegistered = false;

// Init a chat session on creation so the agent header shows on open: creation
// fires powerhouse:document:created, which the change-trigger does not observe.
function ensureCreationListener(ctx: TriggerContext<{ pending: number }, Record<string, unknown>, ChatSessionRegistry>): void {
  if (creationListenerRegistered) return;
  const on = ctx.context.on;
  if (!on) return;
  creationListenerRegistered = true;
  const log = ctx.context.log;

  on('powerhouse:document:created', (payload) => {
    if (payload.documentType !== DOCUMENT_TYPE) return;
    void initCreatedSession(ctx, payload.documentId, log);
  });
}

async function initCreatedSession(ctx: TriggerContext<{ pending: number }, Record<string, unknown>, ChatSessionRegistry>, documentId: string, log?: Logger): Promise<void> {
  try {
    const reactor = await ctx.reactor();
    const agent = await ctx.agent();
    if (!reactor || !agent) return;
    const doc = await reactor.client.get<'powerhouse/chat-session'>(documentId);
    const state = doc.state.global;
    if (state.status === 'COMPLETED' || state.status === 'ABORTED' || state.status === 'ERROR') return;
    await ensureSessionInitialized(reactor, documentId, state, agent, log);
  } catch (err) {
    log?.error(`${TAG} init on create failed for ${documentId}:`, err);
  }
}

/**
 * Run a single chat turn for one session to completion: lazy-init the session,
 * extract attachments, build the prompt, stream the agent response back into the
 * document, and on failure record an assistant ERROR message to close the turn.
 *
 * This is dispatched DETACHED from the watcher's poll loop (see onChange) so it
 * does not block other sessions. It is guarded by the `inFlight` set keyed on
 * documentId, so at most one turn per document runs at a time; turns for
 * DIFFERENT documents run concurrently on their own threadIds.
 */
async function runAgentTurn(
  documentId: string,
  state: ChatSessionState,
  lastMessage: Message,
  reactor: ReactorContext<ChatSessionRegistry>,
  agent: AgentProvider,
  ctx: TriggerContext<{ pending: number }, Record<string, unknown>, ChatSessionRegistry>,
  log?: Logger,
): Promise<void> {
  try {
    // Extract user text from content parts. Kept inside the try so a malformed
    // message surfaces as an ERROR message (closing the turn) rather than
    // rejecting this detached task and leaving the turn open to retry forever.
    const userText = lastMessage.content
      .filter((p: ContentPart) => p.type === 'TEXT' && p.text)
      .map((p: ContentPart) => p.text!)
      .join('\n');

    log?.info(`${TAG} processing ${documentId}: ${userText ? `user said "${userText.slice(0, 80)}..."` : 'attachment-only message'}`);

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
    // Retry transient upstream failures; the bridge only raises this before
    // any content is written, so a re-run can't duplicate. Interrupts aren't retried.
    for (let attempt = 0; ; attempt++) {
      const abortController = new AbortController();
      abortControllers.set(documentId, abortController);
      try {
        const stream = agent.stream(prompt, { threadId, abortSignal: abortController.signal });
        await writeAgentStreamToDocument(stream, {
          reactor,
          documentId,
          log,
        });
        break;
      } catch (streamErr) {
        const canRetry = streamErr instanceof RetryableStreamError && attempt < STREAM_MAX_RETRIES && !abortController.signal.aborted;
        if (!canRetry) throw streamErr;
        const delay = streamRetryDelayMs(streamErr, attempt);
        log?.warn(`${TAG} retryable stream error for ${documentId} (attempt ${attempt + 1}/${STREAM_MAX_RETRIES}), retrying in ${delay}ms: ${streamErr.message}`);
        await sleep(delay);
      } finally {
        abortControllers.delete(documentId);
      }
    }
  } catch (err) {
    log?.error(`${TAG} agent invocation failed for ${documentId}:`, err);
    // Surface the failure as an assistant ERROR message. This also closes
    // the turn: the last message is no longer USER, so the watcher guard
    // and the derived responding state both see the turn as ended.
    const reason = err instanceof Error ? err.message : String(err);
    await reactor.client
      .execute<'powerhouse/chat-session'>(documentId, 'main', [
        addAssistantMessage({
          id: randomUUID(),
          content: [{ id: randomUUID(), type: 'ERROR', error: `Agent failed to respond: ${reason}` }],
          createdAt: new Date().toISOString(),
        }),
      ])
      .catch((e: unknown) => log?.error(`${TAG} failed to record agent error for ${documentId}:`, e));
  } finally {
    abortControllers.delete(documentId);
  }
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
    ensureCreationListener(ctx);

    for (const doc of docs) {
      const documentId = doc.header.id;
      const state = doc.state.global;
      const { status, messages } = state;

      // Guard: skip completed/aborted/error sessions
      if (status === 'COMPLETED' || status === 'ABORTED' || status === 'ERROR') {
        continue;
      }

      // Eager init: populate the agent header (name + avatar) as soon as the
      // session exists. Idempotent; the START_SESSION write re-triggers us.
      if (!state.threadId) {
        try {
          await ensureSessionInitialized(reactor, documentId, state, agent, log);
        } catch (err) {
          log?.error(`${TAG} eager session init failed for ${documentId}:`, err);
        }
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

      // Guard: a set interruptRequested means the user stopped this turn.
      // The flag tombstones the message as unanswered until the next user
      // message clears it (addUserMessage). Skipping writes nothing, so no
      // re-trigger loop.
      if (state.interruptRequested) {
        log?.info(`${TAG} ${documentId} interrupt requested, skipping turn`);
        continue;
      }

      // Guard: empty message (no text, no attachment parts). Recomputable
      // from content on every pass, so the skip is stateless.
      if (!hasMessageContent(lastMessage)) {
        log?.info(`${TAG} ${documentId} user message has no text or attachments, skipping`);
        continue;
      }

      // Dispatch the agent turn as a DETACHED, in-flight-tracked task rather
      // than awaiting it here. The routine drives this trigger from a single
      // serialized poll loop (`await trigger.poll()`), so awaiting a multi-minute
      // agent stream inline blocks EVERY other chat session until it finishes —
      // a second session opened while the first is still building never gets
      // picked up. Detaching keeps the poll loop responsive; independent
      // sessions (distinct threadIds) then stream concurrently. The inFlight
      // guard above plus this add/delete pair dedupe the rapid re-polls that
      // fire while the stream writes back to the document.
      inFlight.add(documentId);
      log?.info(`${TAG} dispatching turn for ${documentId} (detached; ${inFlight.size} in-flight)`);
      // Fire-and-forget: do NOT await (that would re-serialize the loop). The
      // .catch is defensive — runAgentTurn handles its own errors, so this only
      // guards against an unexpected throw becoming an unhandled rejection.
      void runAgentTurn(documentId, state, lastMessage, reactor, agent, ctx, log)
        .catch((err) => log?.error(`${TAG} unexpected error in detached turn for ${documentId}:`, err))
        .finally(() => {
          inFlight.delete(documentId);
        });
    }

    return null;
  },
});
