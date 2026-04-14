/**
 * Bridge between ph-clint StreamChunks and agent-chat document operations.
 *
 * Two directions:
 * - writeStreamToDocument: Consumes agent StreamChunks and dispatches document operations
 * - readMessagesAsHistory: Converts document messages to Mastra conversation format
 */

import type { StreamChunk } from 'ph-clint';
import type {
  AgentChatState,
  ChatMessage,
} from 'agent-app/document-models/agent-chat';

// ── Types ──────────────────────────────────────────────────────────

/** Abstraction over the Reactor client for dispatching actions to a document. */
export interface DocumentDispatcher {
  addAction(documentId: string, action: any): Promise<void>;
}

export interface BridgeOptions {
  dispatcher: DocumentDispatcher;
  documentId: string;
  agentId: string;
}

/** Mastra-compatible message format for conversation history. */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
}

// ── Write: StreamChunk → Document ──────────────────────────────────

/**
 * Wraps an agent's StreamChunk generator, writing each chunk to the
 * agent-chat document while forwarding chunks to the caller.
 *
 * Text-delta chunks are dispatched immediately as sendText operations —
 * the document model's auto-append behavior (same sender + Text type)
 * concatenates them into a single message's text[] array.
 */
export async function* writeStreamToDocument(
  stream: AsyncGenerator<StreamChunk>,
  options: BridgeOptions,
  createAction: typeof import('agent-app/document-models/agent-chat'),
): AsyncGenerator<StreamChunk> {
  const { dispatcher, documentId, agentId } = options;
  const now = () => new Date().toISOString();
  let messageId = generateId();

  for await (const chunk of stream) {
    switch (chunk.type) {
      case 'text-delta':
        await dispatcher.addAction(
          documentId,
          createAction.sendText({
            id: messageId,
            sender: agentId,
            text: chunk.text,
            when: now(),
            format: 'MarkDown',
          }),
        );
        break;

      case 'tool-call':
        // New message ID for tool call
        messageId = generateId();
        await dispatcher.addAction(
          documentId,
          createAction.sendToolCall({
            id: messageId,
            sender: agentId,
            toolName: chunk.toolName,
            argsJson: typeof chunk.args === 'string' ? chunk.args : JSON.stringify(chunk.args),
            when: now(),
          }),
        );
        break;

      case 'tool-result':
        // New message ID for tool result
        messageId = generateId();
        await dispatcher.addAction(
          documentId,
          createAction.sendToolResult({
            id: messageId,
            sender: agentId,
            toolName: chunk.toolName,
            result: typeof chunk.result === 'string' ? chunk.result : JSON.stringify(chunk.result),
            isError: chunk.isError ?? false,
            when: now(),
          }),
        );
        // Next text chunk starts a new message
        messageId = generateId();
        break;

      case 'error':
        messageId = generateId();
        await dispatcher.addAction(
          documentId,
          createAction.sendError({
            id: messageId,
            sender: agentId,
            error: chunk.error,
            when: now(),
          }),
        );
        messageId = generateId();
        break;
    }

    yield chunk;
  }
}

// ── Read: Document → Conversation History ──────────────────────────

/**
 * Convert agent-chat document messages to Mastra conversation format.
 * Agent messages become 'assistant' role, stakeholder messages become 'user'.
 */
export function readMessagesAsHistory(
  state: AgentChatState,
  agentIds: Set<string>,
): ConversationMessage[] {
  const messages: ConversationMessage[] = [];

  for (const msg of state.messages) {
    const role = agentIds.has(msg.sender) ? 'assistant' : 'user';

    switch (msg.type) {
      case 'Text':
        if (msg.text && msg.text.length > 0) {
          messages.push({ role, content: msg.text.join('') });
        }
        break;

      case 'ToolCall':
        if (msg.toolCall) {
          messages.push({
            role: 'assistant',
            content: `[Tool call: ${msg.toolCall.name}(${msg.toolCall.argsJson})]`,
          });
        }
        break;

      case 'ToolResult':
        if (msg.toolResult) {
          messages.push({
            role: 'tool',
            content: msg.toolResult.result,
          });
        }
        break;

      case 'Error':
        if (msg.error) {
          messages.push({ role, content: `Error: ${msg.error}` });
        }
        break;
    }
  }

  return messages;
}

// ── Helpers ────────────────────────────────────────────────────────

let idCounter = 0;
function generateId(): string {
  return `msg-${Date.now()}-${++idCounter}`;
}

/**
 * Write a user message to the document before invoking the agent.
 */
export async function writeUserMessage(
  dispatcher: DocumentDispatcher,
  documentId: string,
  senderId: string,
  text: string,
): Promise<void> {
  const { sendText } = await import('agent-app/document-models/agent-chat');
  await dispatcher.addAction(
    documentId,
    sendText({
      id: generateId(),
      sender: senderId,
      text,
      when: new Date().toISOString(),
      format: 'Text',
    }),
  );
}
