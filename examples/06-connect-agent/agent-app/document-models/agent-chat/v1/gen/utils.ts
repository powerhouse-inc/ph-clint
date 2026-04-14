import type { DocumentModelUtils } from "document-model";
import {
  baseCreateDocument,
  baseSaveToFileHandle,
  baseLoadFromInput,
  defaultBaseState,
  generateId,
} from "document-model";
import { reducer } from "./reducer.js";
import { agentChatDocumentType } from "./document-type.js";
import {
  assertIsAgentChatDocument,
  assertIsAgentChatState,
  isAgentChatDocument,
  isAgentChatState,
} from "./document-schema.js";
import type {
  AgentChatGlobalState,
  AgentChatLocalState,
  AgentChatPHState,
} from "./types.js";

export const initialGlobalState: AgentChatGlobalState = {
  topic: null,
  agents: [],
  stakeholders: [],
  messages: [],
  pruneLength: null,
};
export const initialLocalState: AgentChatLocalState = {};

export const utils: DocumentModelUtils<AgentChatPHState> = {
  fileExtension: ".agcht",
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    const document = baseCreateDocument(utils.createState, state);

    document.header.documentType = agentChatDocumentType;

    // for backwards compatibility, but this is NOT a valid signed document id
    document.header.id = generateId();

    return document;
  },
  saveToFileHandle(document, input) {
    return baseSaveToFileHandle(document, input);
  },
  loadFromInput(input) {
    return baseLoadFromInput(input, reducer);
  },
  isStateOfType(state) {
    return isAgentChatState(state);
  },
  assertIsStateOfType(state) {
    return assertIsAgentChatState(state);
  },
  isDocumentOfType(document) {
    return isAgentChatDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsAgentChatDocument(document);
  },
};
