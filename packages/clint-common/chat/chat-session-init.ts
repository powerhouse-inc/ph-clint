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

async function resolveImageSource(image: string): Promise<{ mimeType: string; stream: ReadableStream<Uint8Array> }> {
  const dataUriMatch = image.match(/^data:([^;]+);base64,/);
  if (dataUriMatch) {
    const mimeType = dataUriMatch[1];
    const base64Data = image.slice(dataUriMatch[0].length);
    const bytes = Buffer.from(base64Data, 'base64');
    const stream = new Blob([bytes]).stream() as ReadableStream<Uint8Array>;
    return { mimeType, stream };
  }
  const res = await fetch(image);
  if (!res.ok) throw new Error(`Failed to fetch agent image: ${res.status} ${res.statusText}`);
  if (!res.body) throw new Error(`Agent image response has no body: ${image}`);
  const mimeType = res.headers.get('content-type') ?? 'application/octet-stream';
  return { mimeType, stream: res.body };
}

export async function ensureSessionInitialized<R extends ChatSessionRegistry>(reactor: ReactorContext<R>, documentId: string, state: ChatSessionState, agent: AgentProvider, log?: Logger): Promise<string> {
  if (state.threadId) return state.threadId;

  const threadId = randomUUID();
  const now = new Date().toISOString();

  log?.info(`${TAG} initializing session ${documentId} with threadId ${threadId}`);
  log?.info(`${TAG} agent.description=${agent.description ? 'set' : 'unset'}, agent.image=${agent.image ? `set (${agent.image.length} chars)` : 'unset'}`);

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
    const service = reactor.attachments;
    if (!service) {
      log?.warn(`${TAG} no attachment service wired; skipping agent image`);
    } else {
      const { mimeType, stream } = await resolveImageSource(agent.image);
      const upload = await service.reserve({ mimeType, fileName: `${agent.id}-avatar` });
      const { ref } = await upload.send(stream);
      actions.push(setAgentImage({ attachment: ref }));
    }
  }

  await reactor.client.execute<'powerhouse/chat-session'>(documentId, 'main', actions);

  return threadId;
}
