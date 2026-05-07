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
import { createDocumentChangeTrigger, type AgentContentPart, type ReactorContext } from '@powerhousedao/ph-clint';
import { ensureSessionInitialized, type ChatSessionRegistry } from './chat-session-init.js';
import { writeAgentStreamToDocument } from './chat-bridge.js';
import { extractAttachments } from './extract-attachments.js';
import type { ChatSessionState, ContentPart, Message } from '@powerhousedao/clint-common/document-models/chat-session';

const DOCUMENT_TYPE = 'powerhouse/chat-session' as const;
const TAG = '[chat-session-watch]';

/** Track documents currently being processed to prevent re-entrancy. */
const inFlight = new Set<string>();

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

    for (const doc of docs) {
      const documentId = doc.header.id;
      const state = doc.state.global as ChatSessionState;
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

      if (!userText) {
        log?.info(`${TAG} ${documentId} user message has no text content, skipping`);
        continue;
      }

      inFlight.add(documentId);
      log?.info(`${TAG} processing ${documentId}: user said "${userText.slice(0, 80)}..."`);

      try {
        // Lazy session init: assigns threadId if not set
        const threadId = await ensureSessionInitialized(
          reactor,
          documentId,
          state,
          agent,
          log,
        );

        // Extract file/image attachments to disk
        const attachments = await extractAttachments(lastMessage, {
          workdir: ctx.context.workdir,
          documentId,
          log,
        });

        // Build multimodal prompt: include images natively so the model
        // can see them, plus file paths so agent tools can read them.
        const imageParts = lastMessage.content.filter(
          (p: ContentPart) => p.type === 'IMAGE' && p.data,
        );

        let prompt: string | AgentContentPart[];
        if (imageParts.length > 0) {
          const parts: AgentContentPart[] = [];
          for (const p of imageParts) {
            parts.push({
              type: 'image',
              image: Buffer.from(p.data!, 'base64'),
              mediaType: p.mediaType ?? undefined,
            });
          }
          let text = userText;
          if (attachments.length > 0) {
            log?.info(`${TAG} extracted ${attachments.length} attachment(s)`);
            const pathList = attachments.map(a => `- ${a.filename}: ${a.localPath}`).join('\n');
            text += `\n\n[Attached files saved to disk]\n${pathList}`;
          }
          parts.push({ type: 'text', text });
          prompt = parts;
        } else if (attachments.length > 0) {
          log?.info(`${TAG} extracted ${attachments.length} attachment(s)`);
          const pathList = attachments.map(a => `- ${a.filename}: ${a.localPath}`).join('\n');
          prompt = `${userText}\n\n[Attached files saved to disk]\n${pathList}`;
        } else {
          prompt = userText;
        }

        // Stream agent response and write to document
        const stream = agent.stream(prompt, { threadId });
        await writeAgentStreamToDocument(stream, {
          reactor,
          documentId,
          log,
        });
      } catch (err) {
        log?.error(`${TAG} agent invocation failed for ${documentId}:`, err);
      } finally {
        inFlight.delete(documentId);
      }
    }

    return null;
  },
});
