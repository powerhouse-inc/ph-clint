import type { DocumentModelUtils } from "document-model";
import {
  baseCreateDocument,
  baseSaveToFileHandle,
  baseLoadFromInput,
  defaultBaseState,
  generateId,
} from "document-model/core";
import type {
  AgentProjectsGlobalState,
  AgentProjectsLocalState,
} from "./types.js";
import type { AgentProjectsPHState } from "./types.js";
import { reducer } from "./reducer.js";
import { agentProjectsDocumentType } from "./document-type.js";
import {
  isAgentProjectsDocument,
  assertIsAgentProjectsDocument,
  isAgentProjectsState,
  assertIsAgentProjectsState,
} from "./document-schema.js";

export const initialGlobalState: AgentProjectsGlobalState = {
  projects: [],
};
export const initialLocalState: AgentProjectsLocalState = {};

export const utils: DocumentModelUtils<AgentProjectsPHState> = {
  fileExtension: ".aprj",
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    const document = baseCreateDocument(utils.createState, state);

    document.header.documentType = agentProjectsDocumentType;

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
    return isAgentProjectsState(state);
  },
  assertIsStateOfType(state) {
    return assertIsAgentProjectsState(state);
  },
  isDocumentOfType(document) {
    return isAgentProjectsDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsAgentProjectsDocument(document);
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
