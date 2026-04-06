import type { DocumentModelUtils } from "document-model";
import {
  baseCreateDocument,
  baseSaveToFileHandle,
  baseLoadFromInput,
  defaultBaseState,
  generateId,
} from "document-model/core";
import type { ClaudeChatGlobalState, ClaudeChatLocalState } from "./types.js";
import type { ClaudeChatPHState } from "./types.js";
import { reducer } from "./reducer.js";
import { claudeChatDocumentType } from "./document-type.js";
import {
  isClaudeChatDocument,
  assertIsClaudeChatDocument,
  isClaudeChatState,
  assertIsClaudeChatState,
} from "./document-schema.js";

export const initialGlobalState: ClaudeChatGlobalState = {
  username: "",
  agents: [],
  messages: [],
  selectedAgent: null,
};
export const initialLocalState: ClaudeChatLocalState = {};

export const utils: DocumentModelUtils<ClaudeChatPHState> = {
  fileExtension: ".cchat",
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    const document = baseCreateDocument(utils.createState, state);

    document.header.documentType = claudeChatDocumentType;

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
    return isClaudeChatState(state);
  },
  assertIsStateOfType(state) {
    return assertIsClaudeChatState(state);
  },
  isDocumentOfType(document) {
    return isClaudeChatDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsClaudeChatDocument(document);
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
