import type { ChatSessionUserOperations } from 'document-models/chat-session/v1';
import { InvalidContentPartError, MessageNotFoundError, NotUserMessageError } from '../../gen/user/error.js';

export const chatSessionUserOperations: ChatSessionUserOperations = {
  addUserMessageOperation(state, action) {
    for (const p of action.input.content) {
      if (p.type === 'TEXT' && !p.text) {
        throw new InvalidContentPartError('TEXT part requires text');
      }
    }
    const parts = action.input.content.map((p) => ({
      id: p.id,
      type: p.type,
      text: p.text || null,
      toolCallId: null,
      toolName: null,
      args: null,
      result: null,
      isError: null,
      mediaType: p.mediaType || null,
      url: p.url || null,
      data: p.data || null,
      filename: p.filename || null,
      error: null,
    }));
    state.messages.push({
      id: action.input.id,
      role: 'USER',
      content: parts,
      stepIndex: null,
      createdAt: action.input.createdAt,
      usage: null,
    });
    if (state.usage) state.usage.totalMessages += 1;
  },
  deleteUserMessageOperation(state, action) {
    const idx = state.messages.findIndex((m) => m.id === action.input.messageId);
    if (idx === -1) throw new MessageNotFoundError('Message not found: ' + action.input.messageId);
    if (state.messages[idx].role !== 'USER') throw new NotUserMessageError('Can only delete USER messages');
    state.messages.splice(idx, 1);
    if (state.usage) state.usage.totalMessages -= 1;
  },
  abortSessionOperation(state, action) {
    state.status = 'ABORTED';
    state.endedAt = action.input.endedAt;
  },
};
