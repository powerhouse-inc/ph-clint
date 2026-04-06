import type { DocumentModelUtils } from "document-model";
import {
  baseCreateDocument,
  baseSaveToFileHandle,
  baseLoadFromInput,
  defaultBaseState,
  generateId,
} from "document-model/core";
import type { AgentInboxGlobalState, AgentInboxLocalState } from "./types.js";
import type { AgentInboxPHState } from "./types.js";
import { reducer } from "./reducer.js";
import { agentInboxDocumentType } from "./document-type.js";
import {
  isAgentInboxDocument,
  assertIsAgentInboxDocument,
  isAgentInboxState,
  assertIsAgentInboxState,
} from "./document-schema.js";

export const initialGlobalState: AgentInboxGlobalState = {
  agent: {
    name: null,
    ethAddress: null,
    role: null,
    description: null,
    avatar: null,
  },
  stakeholders: [],
  threads: [],
};
export const initialLocalState: AgentInboxLocalState = {};

export const utils: DocumentModelUtils<AgentInboxPHState> = {
  fileExtension: ".aib",
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    const document = baseCreateDocument(utils.createState, state);

    document.header.documentType = agentInboxDocumentType;

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
    return isAgentInboxState(state);
  },
  assertIsStateOfType(state) {
    return assertIsAgentInboxState(state);
  },
  isDocumentOfType(document) {
    return isAgentInboxDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsAgentInboxDocument(document);
  },
};

export const createDocument = utils.createDocument;
export const createState = utils.createState;
export const saveToFileHandle = utils.saveToFileHandle;
export const loadFromInput = utils.loadFromInput;
export const isStateOfType = utils.isStateOfType;
export const assertIsStateOfType = utils.assertIsStateOfType;
export const isDocumentOfType = utils.isDocumentOfType;
export const assertIsDocumentOfType = utils.assertIsDocumentOfType;
