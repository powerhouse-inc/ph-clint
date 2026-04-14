import type {
  AgentChatMessagesOperations,
  AgentChatState,
} from "document-models/agent-chat/v1";
import {
  SenderNotFoundError,
  InvalidMentionError,
  MessageNotFoundError,
  ReaderNotFoundError,
} from "../../gen/messages/error.js";

// Helper function to validate sender exists
function validateSender(state: AgentChatState, senderId: string): void {
  const senderExists =
    state.agents.some((a) => a.id === senderId) ||
    state.stakeholders.some((s) => s.id === senderId);
  if (!senderExists) {
    throw new SenderNotFoundError(
      `Sender with ID ${senderId} not found in agents or stakeholders`,
    );
  }
}

// Helper function to validate mentioned users exist
function validateMentioned(
  state: AgentChatState,
  mentioned: string[] | null | undefined,
): void {
  if (!mentioned || mentioned.length === 0) return;
  for (const userId of mentioned) {
    const exists =
      state.agents.some((a) => a.id === userId) ||
      state.stakeholders.some((s) => s.id === userId);
    if (!exists) {
      throw new InvalidMentionError(
        `Mentioned user with ID ${userId} not found`,
      );
    }
  }
}

// Helper function to prune messages if necessary
function pruneMessagesIfNeeded(state: AgentChatState): void {
  if (state.pruneLength && state.messages.length > state.pruneLength) {
    state.messages = state.messages.slice(-state.pruneLength);
  }
}

export const agentChatMessagesOperations: AgentChatMessagesOperations = {
  sendTextOperation(state, action) {
    validateSender(state, action.input.sender);
    validateMentioned(state, action.input.mentioned);

    // Check if we should auto-append to last message
    const lastMessage = state.messages.at(-1);

    if (
      lastMessage &&
      lastMessage.sender === action.input.sender &&
      lastMessage.type === "Text" &&
      lastMessage.text
    ) {
      // Auto-append to last message
      lastMessage.text.push(action.input.text);
      lastMessage.updated = action.input.when;
      // Upgrade format to Mixed if different
      if (
        action.input.format &&
        lastMessage.format &&
        lastMessage.format !== action.input.format
      ) {
        lastMessage.format = "Mixed";
      } else if (action.input.format && !lastMessage.format) {
        lastMessage.format = action.input.format;
      }
    } else {
      // Create new message
      state.messages.push({
        id: action.input.id,
        sender: action.input.sender,
        mentioned: action.input.mentioned || [],
        when: action.input.when,
        updated: null,
        type: "Text",
        format: action.input.format || null,
        text: [action.input.text],
        toolCall: null,
        toolResult: null,
        error: null,
        reactions: [],
        readBy: [],
      });
    }

    pruneMessagesIfNeeded(state);
  },
  sendErrorOperation(state, action) {
    validateSender(state, action.input.sender);
    validateMentioned(state, action.input.mentioned);

    state.messages.push({
      id: action.input.id,
      sender: action.input.sender,
      mentioned: action.input.mentioned || [],
      when: action.input.when,
      updated: null,
      type: "Error",
      format: action.input.format || null,
      text: null,
      toolCall: null,
      toolResult: null,
      error: action.input.error,
      reactions: [],
      readBy: [],
    });

    pruneMessagesIfNeeded(state);
  },
  sendToolCallOperation(state, action) {
    validateSender(state, action.input.sender);
    validateMentioned(state, action.input.mentioned);

    state.messages.push({
      id: action.input.id,
      sender: action.input.sender,
      mentioned: action.input.mentioned || [],
      when: action.input.when,
      updated: null,
      type: "ToolCall",
      format: null,
      text: null,
      toolCall: {
        name: action.input.toolName,
        argsJson: action.input.argsJson,
      },
      toolResult: null,
      error: null,
      reactions: [],
      readBy: [],
    });

    pruneMessagesIfNeeded(state);
  },
  sendToolResultOperation(state, action) {
    validateSender(state, action.input.sender);
    validateMentioned(state, action.input.mentioned);

    state.messages.push({
      id: action.input.id,
      sender: action.input.sender,
      mentioned: action.input.mentioned || [],
      when: action.input.when,
      updated: null,
      type: "ToolResult",
      format: action.input.format || null,
      text: null,
      toolCall: null,
      toolResult: {
        name: action.input.toolName,
        result: action.input.result,
        isError: action.input.isError,
      },
      error: null,
      reactions: [],
      readBy: [],
    });

    pruneMessagesIfNeeded(state);
  },
  deleteMessageOperation(state, action) {
    const index = state.messages.findIndex((m) => m.id === action.input.id);
    if (index === -1) {
      throw new MessageNotFoundError(
        `Message with ID ${action.input.id} not found`,
      );
    }
    state.messages.splice(index, 1);
  },
  markAsReadOperation(state, action) {
    const message = state.messages.find((m) => m.id === action.input.messageId);
    if (!message) {
      throw new MessageNotFoundError(
        `Message with ID ${action.input.messageId} not found`,
      );
    }

    const readerExists =
      state.agents.some((a) => a.id === action.input.readBy) ||
      state.stakeholders.some((s) => s.id === action.input.readBy);
    if (!readerExists) {
      throw new ReaderNotFoundError(
        `Reader with ID ${action.input.readBy} not found`,
      );
    }

    if (!message.readBy) {
      message.readBy = [];
    }
    if (!message.readBy.includes(action.input.readBy)) {
      message.readBy.push(action.input.readBy);
    }
  },
};
