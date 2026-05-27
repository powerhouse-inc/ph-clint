/**
 * Bridge between ph-clint StreamChunks and chat-session document operations.
 *
 * Consumes an agent's StreamChunk generator and dispatches the corresponding
 * chat-session operations to the reactor, producing a streaming experience
 * in any client watching the document (Connect UI, MCP, etc.).
 *
 * Text deltas are accumulated and flushed on a throttle interval (~500ms)
 * to avoid flooding the reactor with per-token operations.
 */
import { randomUUID } from 'node:crypto';
import type { StreamChunk, ReactorContext, Logger, DocumentRegistry } from '@powerhousedao/ph-clint';
import {
  addAssistantMessage,
  appendAssistantContent,
  updateAssistantContent,
  addToolResult,
  addToolOutput,
  updateUsageSummary,
  endSession,
} from '@powerhousedao/clint-common/document-models/chat-session';
import type { ChatSessionAction } from '@powerhousedao/clint-common/document-models/chat-session';
import type { ChatSessionRegistry } from './chat-session-init.js';

const FLUSH_INTERVAL_MS = 500;

interface BridgeStats {
  totalMessages: number;
  totalSteps: number;
  totalToolCalls: number;
}

export interface WriteBridgeOptions<R extends ChatSessionRegistry = ChatSessionRegistry> {
  reactor: ReactorContext<R>;
  documentId: string;
  log?: Logger;
}

const TAG = '[chat-bridge]';

/**
 * Consume an agent stream and write each chunk to a chat-session document.
 */
export async function writeAgentStreamToDocument<R extends ChatSessionRegistry>(
  stream: AsyncGenerator<StreamChunk>,
  options: WriteBridgeOptions<R>,
): Promise<void> {
  const { reactor, documentId, log } = options;
  const dispatch = (action: ChatSessionAction) =>
    reactor.client.execute<'powerhouse/chat-session'>(documentId, 'main', [action]);

  // State machine
  let currentMsgId: string | null = null;
  let currentPartId: string | null = null;
  let textBuffer = '';
  let stepIndex = 0;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let currentToolMsgId: string | null = null;
  const stats: BridgeStats = { totalMessages: 0, totalSteps: 0, totalToolCalls: 0 };

  const now = () => new Date().toISOString();

  async function flushText(): Promise<void> {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (!textBuffer || !currentMsgId || !currentPartId) return;

    await dispatch(
      updateAssistantContent({
        messageId: currentMsgId,
        partId: currentPartId,
        text: textBuffer,
      }),
    );
  }

  function scheduleFlush(): void {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushText().catch((err) =>
        log?.error(`${TAG} throttled flush error:`, err),
      );
    }, FLUSH_INTERVAL_MS);
  }

  try {
    for await (const chunk of stream) {
      switch (chunk.type) {
        case 'text-delta': {
          if (!currentMsgId) {
            currentMsgId = randomUUID();
            currentPartId = randomUUID();
            textBuffer = chunk.text;
            stats.totalMessages++;
            stats.totalSteps++;

            await dispatch(
              addAssistantMessage({
                id: currentMsgId,
                content: [
                  {
                    id: currentPartId,
                    type: 'TEXT',
                    text: chunk.text,
                  },
                ],
                stepIndex,
                createdAt: now(),
              }),
            );
          } else {
            textBuffer += chunk.text;
            scheduleFlush();
          }
          break;
        }

        case 'tool-call': {
          await flushText();

          if (!currentMsgId) {
            currentMsgId = randomUUID();
            currentPartId = randomUUID();
            stats.totalMessages++;
            stats.totalSteps++;

            await dispatch(
              addAssistantMessage({
                id: currentMsgId,
                content: [
                  {
                    id: currentPartId,
                    type: 'TOOL_CALL',
                    toolCallId: chunk.toolCallId ?? randomUUID(),
                    toolName: chunk.toolName,
                    args: typeof chunk.args === 'string'
                      ? chunk.args
                      : JSON.stringify(chunk.args),
                  },
                ],
                stepIndex,
                createdAt: now(),
              }),
            );
          } else {
            const partId = randomUUID();
            stats.totalToolCalls++;

            await dispatch(
              appendAssistantContent({
                messageId: currentMsgId,
                part: {
                  id: partId,
                  type: 'TOOL_CALL',
                  toolCallId: chunk.toolCallId ?? randomUUID(),
                  toolName: chunk.toolName,
                  args: typeof chunk.args === 'string'
                    ? chunk.args
                    : JSON.stringify(chunk.args),
                },
              }),
            );
          }
          break;
        }

        case 'tool-result': {
          await flushText();

          const toolMsgId = randomUUID();
          const toolPartId = randomUUID();
          currentToolMsgId = toolMsgId;
          stats.totalMessages++;

          await dispatch(
            addToolResult({
              id: toolMsgId,
              content: [
                {
                  id: toolPartId,
                  type: 'TOOL_RESULT',
                  toolCallId: chunk.toolCallId ?? '',
                  toolName: chunk.toolName,
                  result: typeof chunk.result === 'string'
                    ? chunk.result
                    : JSON.stringify(chunk.result),
                  isError: chunk.isError ?? false,
                },
              ],
              stepIndex,
              createdAt: now(),
            }),
          );

          stepIndex++;
          currentMsgId = null;
          currentPartId = null;
          textBuffer = '';
          break;
        }

        case 'tool-output': {
          if (currentToolMsgId) {
            const partId = randomUUID();
            await dispatch(
              addToolOutput({
                messageId: currentToolMsgId,
                partId,
                toolCallId: chunk.toolCallId ?? '',
                toolName: chunk.toolName,
                text: chunk.text,
              }),
            );
          }
          break;
        }

        case 'error': {
          await flushText();
          log?.error(`${TAG} stream error for ${documentId}: ${chunk.error}`);

          await dispatch(
            endSession({
              status: 'ERROR',
              endedAt: now(),
            }),
          );
          return;
        }
      }
    }

    await flushText();

    await dispatch(
      updateUsageSummary({
        totalMessages: stats.totalMessages,
        totalSteps: stats.totalSteps,
        totalToolCalls: stats.totalToolCalls,
      }),
    );

    log?.info(
      `${TAG} stream complete for ${documentId}: ` +
      `${stats.totalMessages} msgs, ${stats.totalSteps} steps, ${stats.totalToolCalls} tool calls`,
    );
  } catch (err) {
    await flushText().catch(() => {});
    log?.error(`${TAG} fatal error for ${documentId}:`, err);

    await dispatch(
      endSession({
        status: 'ERROR',
        endedAt: now(),
      }),
    ).catch((e: unknown) => log?.error(`${TAG} failed to dispatch END_SESSION:`, e));

    throw err;
  } finally {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  }
}
