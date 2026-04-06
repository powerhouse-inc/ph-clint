import {
  StakeholderNotFoundError,
  ThreadNotFoundError,
  MessageNotFoundError,
  StakeholderRemovedError,
} from "../../gen/threads/error.js";
import type { AgentInboxThreadsOperations } from "@powerhousedao/agent-manager/document-models/agent-inbox/v1";

export const agentInboxThreadsOperations: AgentInboxThreadsOperations = {
  createThreadOperation(state, action) {
    // Check if stakeholder exists
    const stakeholder = state.stakeholders.find(
      (s) => s.id === action.input.stakeholder,
    );
    if (!stakeholder) {
      throw new StakeholderNotFoundError(
        `Stakeholder with ID ${action.input.stakeholder} not found`,
      );
    }

    const newThread = {
      id: action.input.id,
      topic: action.input.topic || null,
      stakeholder: action.input.stakeholder,
      status: "Open" as const,
      messages: [
        {
          id: action.input.initialMessage.id,
          flow: action.input.initialMessage.flow,
          when: action.input.initialMessage.when,
          content: action.input.initialMessage.content,
          read: false,
        },
      ],
    };

    state.threads.push(newThread);
  },
  sendAgentMessageOperation(state, action) {
    const thread = state.threads.find((t) => t.id === action.input.threadId);
    if (!thread) {
      throw new ThreadNotFoundError(
        `Thread with ID ${action.input.threadId} not found`,
      );
    }

    const newMessage = {
      id: action.input.messageId,
      flow: "Outgoing" as const,
      when: action.input.when,
      content: action.input.content,
      read: false,
    };

    thread.messages.push(newMessage);
  },
  setThreadTopicOperation(state, action) {
    const thread = state.threads.find((t) => t.id === action.input.id);
    if (!thread) {
      throw new ThreadNotFoundError(
        `Thread with ID ${action.input.id} not found`,
      );
    }

    thread.topic = action.input.topic || null;
  },
  editMessageContentOperation(state, action) {
    // Find the message across all threads
    let messageFound = false;
    for (const thread of state.threads) {
      const message = thread.messages.find((m) => m.id === action.input.id);
      if (message) {
        message.content = action.input.newContent;
        messageFound = true;
        break;
      }
    }

    if (!messageFound) {
      throw new MessageNotFoundError(
        `Message with ID ${action.input.id} not found`,
      );
    }
  },
  markMessageReadOperation(state, action) {
    // Find the message across all threads
    let messageFound = false;
    for (const thread of state.threads) {
      const message = thread.messages.find((m) => m.id === action.input.id);
      if (message) {
        message.read = true;
        messageFound = true;
        break;
      }
    }

    if (!messageFound) {
      throw new MessageNotFoundError(
        `Message with ID ${action.input.id} not found`,
      );
    }
  },
  markMessageUnreadOperation(state, action) {
    // Find the message across all threads
    let messageFound = false;
    for (const thread of state.threads) {
      const message = thread.messages.find((m) => m.id === action.input.id);
      if (message) {
        message.read = false;
        messageFound = true;
        break;
      }
    }

    if (!messageFound) {
      throw new MessageNotFoundError(
        `Message with ID ${action.input.id} not found`,
      );
    }
  },
  sendStakeholderMessageOperation(state, action) {
    const thread = state.threads.find((t) => t.id === action.input.threadId);
    if (!thread) {
      throw new ThreadNotFoundError(
        `Thread with ID ${action.input.threadId} not found`,
      );
    }

    // Check if the stakeholder associated with this thread is removed
    const stakeholder = state.stakeholders.find(
      (s) => s.id === thread.stakeholder,
    );
    if (!stakeholder) {
      throw new StakeholderNotFoundError(
        `Stakeholder for thread ${action.input.threadId} not found`,
      );
    }

    if (stakeholder.removed) {
      throw new StakeholderRemovedError(
        `Stakeholder ${stakeholder.name} has been removed and cannot send messages`,
      );
    }

    const newMessage = {
      id: action.input.messageId,
      flow: "Incoming" as const,
      when: action.input.when,
      content: action.input.content,
      read: false,
    };

    thread.messages.push(newMessage);
  },
};
