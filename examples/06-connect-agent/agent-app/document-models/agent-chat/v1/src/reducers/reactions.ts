import type { AgentChatReactionsOperations } from "document-models/agent-chat/v1";
import {
  MessageNotFoundError,
  SenderNotFoundError,
  DuplicateReactionError,
  ReactionNotFoundError,
} from "../../gen/reactions/error.js";

export const agentChatReactionsOperations: AgentChatReactionsOperations = {
  addReactionOperation(state, action) {
    const message = state.messages.find((m) => m.id === action.input.messageId);
    if (!message) {
      throw new MessageNotFoundError(
        `Message with ID ${action.input.messageId} not found`,
      );
    }

    const senderExists =
      state.agents.some((a) => a.id === action.input.sender) ||
      state.stakeholders.some((s) => s.id === action.input.sender);
    if (!senderExists) {
      throw new SenderNotFoundError(
        `Sender with ID ${action.input.sender} not found`,
      );
    }

    // Check for duplicate reaction (same sender + emoji)
    if (!message.reactions) {
      message.reactions = [];
    }
    const exists = message.reactions.some(
      (r) => r.sender === action.input.sender && r.emoji === action.input.emoji,
    );
    if (exists) {
      throw new DuplicateReactionError(
        `Reaction from ${action.input.sender} with emoji ${action.input.emoji} already exists`,
      );
    }

    message.reactions.push({
      sender: action.input.sender,
      emoji: action.input.emoji,
    });
  },
  removeReactionOperation(state, action) {
    const message = state.messages.find((m) => m.id === action.input.messageId);
    if (!message) {
      throw new MessageNotFoundError(
        `Message with ID ${action.input.messageId} not found`,
      );
    }

    if (!message.reactions) {
      throw new ReactionNotFoundError(
        `Reaction not found on message ${action.input.messageId}`,
      );
    }

    const index = message.reactions.findIndex(
      (r) => r.sender === action.input.sender && r.emoji === action.input.emoji,
    );
    if (index === -1) {
      throw new ReactionNotFoundError(
        `Reaction from ${action.input.sender} with emoji ${action.input.emoji} not found`,
      );
    }

    message.reactions.splice(index, 1);
  },
};
