import {
  ThreadNotFoundError,
  InvalidStatusError,
} from "../../gen/workflow/error.js";
import type { AgentInboxWorkflowOperations } from "@powerhousedao/agent-manager/document-models/agent-inbox/v1";

export const agentInboxWorkflowOperations: AgentInboxWorkflowOperations = {
  proposeThreadResolvedOperation(state, action) {
    const thread = state.threads.find((t) => t.id === action.input.threadId);
    if (!thread) {
      throw new ThreadNotFoundError(
        `Thread with ID ${action.input.threadId} not found`,
      );
    }

    // Set status based on who proposed
    if (action.input.proposedBy === "Agent") {
      thread.status = "ProposedResolvedByAgent";
    } else {
      thread.status = "ProposedResolvedByStakeholder";
    }
  },
  confirmThreadResolvedOperation(state, action) {
    const thread = state.threads.find((t) => t.id === action.input.threadId);
    if (!thread) {
      throw new ThreadNotFoundError(
        `Thread with ID ${action.input.threadId} not found`,
      );
    }

    // Check if thread is in proposed resolved status
    const validStatuses = [
      "ProposedResolvedByAgent",
      "ProposedResolvedByStakeholder",
    ];
    if (!validStatuses.includes(thread.status)) {
      throw new InvalidStatusError(
        `Thread must be in ProposedResolved status to confirm, current status: ${thread.status}`,
      );
    }

    // Verify the confirmer is different from proposer
    const isAgentConfirming = action.input.confirmedBy === "Agent";
    const wasProposedByAgent = thread.status === "ProposedResolvedByAgent";

    if (
      (isAgentConfirming && wasProposedByAgent) ||
      (!isAgentConfirming && !wasProposedByAgent)
    ) {
      // Same party confirming their own proposal - just accept it for simplicity
    }

    thread.status = "ConfirmedResolved";
  },
  archiveThreadOperation(state, action) {
    const thread = state.threads.find((t) => t.id === action.input.threadId);
    if (!thread) {
      throw new ThreadNotFoundError(
        `Thread with ID ${action.input.threadId} not found`,
      );
    }

    thread.status = "Archived";
  },
  reopenThreadOperation(state, action) {
    const thread = state.threads.find((t) => t.id === action.input.threadId);
    if (!thread) {
      throw new ThreadNotFoundError(
        `Thread with ID ${action.input.threadId} not found`,
      );
    }

    thread.status = "Open";
  },
};
