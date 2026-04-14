import type { AgentChatBaseOperations } from "document-models/agent-chat/v1";
import { InvalidPruneLengthError } from "../../gen/base/error.js";

export const agentChatBaseOperations: AgentChatBaseOperations = {
  setTopicOperation(state, action) {
    state.topic = action.input.topic;
  },
  clearTopicOperation(_state, _action) {
    _state.topic = null;
  },
  setPruneLengthOperation(state, action) {
    if (action.input.pruneLength <= 0) {
      throw new InvalidPruneLengthError("Prune length must be greater than 0");
    }
    state.pruneLength = action.input.pruneLength;
    // Prune messages if necessary
    if (state.messages.length > action.input.pruneLength) {
      state.messages = state.messages.slice(-action.input.pruneLength);
    }
  },
  removePruneLengthOperation(state, _action) {
    state.pruneLength = null;
  },
};
