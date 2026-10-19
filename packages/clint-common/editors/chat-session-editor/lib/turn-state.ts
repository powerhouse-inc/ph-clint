import { isFailedTurn } from 'document-models/chat-session';
import type { ChatSessionState, Message } from 'document-models/chat-session';

/** Delivery state of the latest user message. A message the editor can read is
 *  in the synced document, so it is at least delivered. */
export type DeliveryState = 'delivered' | 'picked-up';

/** Time after which an unpicked user message is flagged as "Not picked up yet". */
export const NOT_PICKED_UP_AFTER_MS = 60_000;

export interface TurnView {
  /** The agent is working on a turn (drives the typing indicator and stop button). */
  responding: boolean;
  /** The latest USER message, if any. */
  lastUserMessage: Message | null;
  /** Delivery state of `lastUserMessage`. */
  lastUserDelivery: DeliveryState | null;
  /** Id of the failed-turn message that can be retried right now: the last
   *  message of the conversation, while no retry is in progress. */
  retryableFailureId: string | null;
}

type TurnStateInput = Pick<ChatSessionState, 'status' | 'interruptRequested' | 'messages'> & {
  /** Undefined on documents created before retries existed. */
  retryRequestedFor?: ChatSessionState['retryRequestedFor'];
};

function isAfter(a: string | null | undefined, b: string): boolean {
  return !!a && Date.parse(a) > Date.parse(b);
}

function isResponding(state: TurnStateInput, lastUserIdx: number): boolean {
  const { status, interruptRequested, messages } = state;
  if (status !== 'ACTIVE' || interruptRequested) return false;
  if (lastUserIdx === -1) return false;
  if (state.retryRequestedFor) return true;

  // Only messages after the latest failed turn count: a failure ends the turn
  // unless the user message was picked up again after it (a retry started).
  let start = lastUserIdx + 1;
  for (let i = messages.length - 1; i > lastUserIdx; i--) {
    const failure = messages[i].failure;
    if (!isFailedTurn(messages[i]) || !failure) continue;
    const userMessage = messages.find((m) => m.id === failure.userMessageId) ?? messages[lastUserIdx];
    if (!isAfter(userMessage.pickedUpAt, failure.failedAt)) return false;
    start = i + 1;
    break;
  }

  for (let i = start; i < messages.length; i++) {
    const m = messages[i];
    if (m.role === 'ASSISTANT' && m.finishedAt) return false;
  }
  return true;
}

export function deriveTurnView(state: TurnStateInput): TurnView {
  const { messages } = state;
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'USER') {
      lastUserIdx = i;
      break;
    }
  }

  const responding = isResponding(state, lastUserIdx);
  const lastUserMessage = lastUserIdx === -1 ? null : messages[lastUserIdx];

  let lastUserDelivery: DeliveryState | null = null;
  if (lastUserMessage) {
    // Legacy documents have no pickedUpAt; a reply proves the agent picked it up.
    const answered = messages.slice(lastUserIdx + 1).some((m) => m.role === 'ASSISTANT' || m.role === 'TOOL');
    lastUserDelivery = lastUserMessage.pickedUpAt || answered ? 'picked-up' : 'delivered';
  }

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
  const retryableFailureId = state.status === 'ACTIVE' && !responding && lastMessage && isFailedTurn(lastMessage) ? lastMessage.id : null;

  return { responding, lastUserMessage, lastUserDelivery, retryableFailureId };
}
