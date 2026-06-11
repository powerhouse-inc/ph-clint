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
import { addAssistantMessage, appendAssistantContent, updateAssistantContent, addToolResult, addToolOutput, updateUsageSummary, endSession } from '@powerhousedao/clint-common/document-models/chat-session';
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
 * Cap on any tool text persisted to the document. The document is a mirror —
 * the model reads the full result from its own memory — so verbose tools
 * (command output, search) are elided rather than bloating every load.
 */
const MAX_TOOL_RESULT_CHARS = 1_000;

/**
 * Make tool text safe and bounded for the operation store: cap its length,
 * then strip characters JSON-backed stores (Postgres jsonb) reject — NUL and
 * unpaired surrogates, which otherwise fail the write with "unsupported
 * Unicode escape sequence". Applies to every tool result, not just reads.
 */
function sanitizeForStore(text: string, log?: Logger, label = 'tool result'): string {
  let capped = text;
  if (text.length > MAX_TOOL_RESULT_CHARS) {
    log?.warn(`${TAG} truncated ${label} from ${text.length} to ${MAX_TOOL_RESULT_CHARS} chars`);
    capped = `${text.slice(0, MAX_TOOL_RESULT_CHARS)}\n…[truncated ${text.length - MAX_TOOL_RESULT_CHARS} chars]`;
  }
  let out = '';
  for (let i = 0; i < capped.length; i++) {
    const code = capped.charCodeAt(i);
    if (code === 0) continue; // NUL
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = capped.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += capped[i] + capped[i + 1];
        i++;
      } else {
        out += '�'; // unpaired high surrogate
      }
      continue;
    }
    if (code >= 0xdc00 && code <= 0xdfff) {
      out += '�'; // unpaired low surrogate
      continue;
    }
    out += capped[i];
  }
  return out;
}

/**
 * Tools whose result is file contents. The document never stores file bodies —
 * the model has the full read via its own memory — so only the metadata header
 * the tool prepends ("path (N bytes, encoding)") is persisted.
 */
const FILE_CONTENT_TOOLS = new Set(['mastra_workspace_read_file']);

/**
 * Build the persisted form of a tool result. Workspace media reads return a
 * base64 blob ({ __workspaceMedia, text, mediaType, data }); keep the header
 * and media type, drop the blob. File-content tools keep only their header
 * line. Everything else is serialized, capped, and stripped of store-hostile
 * characters.
 */
/** Mastra wraps a tool throw in an error envelope that triples the message
 *  (message, details.errorMessage, cause) alongside generic domain/category/
 *  code/argsJson fields. Only the message is actionable, so collapse to it —
 *  keeps the stored result small for the reader and the model's context. The
 *  result reaches here either as the object or already JSON-stringified. */
function condenseErrorEnvelope(result: unknown): string | null {
  // Thrown error instance (MastraError and subclasses): the fields show via a
  // toJSON, not own properties, so read the message directly.
  if (result instanceof Error) {
    return typeof result.message === 'string' && result.message ? result.message : null;
  }
  let obj: unknown = result;
  if (typeof obj === 'string') {
    const s = obj.trim();
    if (!(s.startsWith('{') && s.includes('"code"') && s.includes('"domain"'))) return null;
    try {
      obj = JSON.parse(s);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== 'object') return null;
  const e = obj as { message?: unknown; code?: unknown; domain?: unknown; details?: unknown };
  if (typeof e.message === 'string' && (typeof e.code === 'string' || typeof e.domain === 'string' || e.details !== undefined)) {
    return e.message;
  }
  return null;
}

function prepareToolResult(result: unknown, toolName: string, log?: Logger): { result: string; mediaType: string | null } {
  if (result && typeof result === 'object' && (result as { __workspaceMedia?: unknown }).__workspaceMedia) {
    const media = result as { text?: string; mediaType?: string };
    return { result: sanitizeForStore(media.text ?? '[media]', log, toolName), mediaType: media.mediaType ?? null };
  }
  const condensed = condenseErrorEnvelope(result);
  if (condensed !== null) {
    return { result: sanitizeForStore(condensed, log, toolName), mediaType: null };
  }
  const raw = typeof result === 'string' ? result : JSON.stringify(result) ?? '';
  if (FILE_CONTENT_TOOLS.has(toolName)) {
    // Keep the header line only; everything after the first newline is file body.
    return { result: sanitizeForStore(raw.split('\n', 1)[0], log, toolName), mediaType: null };
  }
  return { result: sanitizeForStore(raw, log, toolName), mediaType: null };
}

/**
 * Consume an agent stream and write each chunk to a chat-session document.
 */
export async function writeAgentStreamToDocument<R extends ChatSessionRegistry>(stream: AsyncGenerator<StreamChunk>, options: WriteBridgeOptions<R>): Promise<void> {
  const { reactor, documentId, log } = options;
  const dispatch = (action: ChatSessionAction) => reactor.client.execute<'powerhouse/chat-session'>(documentId, 'main', [action]);

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
      flushText().catch((err) => log?.error(`${TAG} throttled flush error:`, err));
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
                    args: typeof chunk.args === 'string' ? chunk.args : JSON.stringify(chunk.args),
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
                  args: typeof chunk.args === 'string' ? chunk.args : JSON.stringify(chunk.args),
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

          const prepared = prepareToolResult(chunk.result, chunk.toolName, log);

          await dispatch(
            addToolResult({
              id: toolMsgId,
              content: [
                {
                  id: toolPartId,
                  type: 'TOOL_RESULT',
                  toolCallId: chunk.toolCallId ?? '',
                  toolName: chunk.toolName,
                  result: prepared.result,
                  mediaType: prepared.mediaType,
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
                text: sanitizeForStore(chunk.text, log, `${chunk.toolName} output`),
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

    log?.info(`${TAG} stream complete for ${documentId}: ` + `${stats.totalMessages} msgs, ${stats.totalSteps} steps, ${stats.totalToolCalls} tool calls`);
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
