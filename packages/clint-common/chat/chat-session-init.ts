/**
 * Lazy session initializer for chat-session documents.
 *
 * If the document already has a threadId, returns it.
 * Otherwise dispatches START_SESSION to assign one,
 * plus SET_AGENT_IMAGE if the agent has an avatar.
 */
import { randomUUID } from 'node:crypto';
import type { ReactorContext, AgentProvider, Logger, DocumentRegistry, RegistryEntry } from '@powerhousedao/ph-clint';
import { startSession, setAgentImage } from '@powerhousedao/clint-common/document-models/chat-session';
import type { ChatSessionState, ChatSessionPHState, ChatSessionAction } from '@powerhousedao/clint-common/document-models/chat-session';

const TAG = '[chat-session-init]';

/** Minimum registry constraint: must include chat-session. */
export type ChatSessionRegistry = DocumentRegistry & {
  'powerhouse/chat-session': RegistryEntry<ChatSessionPHState, ChatSessionAction>;
};

export async function ensureSessionInitialized<R extends ChatSessionRegistry>(
  reactor: ReactorContext<R>,
  documentId: string,
  state: ChatSessionState,
  agent: AgentProvider,
  log?: Logger,
): Promise<string> {
  if (state.threadId) return state.threadId;

  const threadId = randomUUID();
  const now = new Date().toISOString();

  log?.info(`${TAG} initializing session ${documentId} with threadId ${threadId}`);

  const actions: Parameters<typeof reactor.client.execute<'powerhouse/chat-session'>>[2] = [
    startSession({
      threadId,
      resourceId: documentId,
      startedAt: now,
      agent: {
        id: agent.id,
        name: agent.name ?? agent.id,
        description: agent.description,
      },
    }),
  ];

  if (agent.image) {
    const dataUriMatch = agent.image.match(/^data:([^;]+);base64,/);
    if (dataUriMatch) {
      actions.push(setAgentImage({ data: agent.image, mediaType: dataUriMatch[1] }));
    } else {
      actions.push(setAgentImage({ url: agent.image }));
    }
  }

  await reactor.client.execute<'powerhouse/chat-session'>(documentId, 'main', actions);

  return threadId;
}
