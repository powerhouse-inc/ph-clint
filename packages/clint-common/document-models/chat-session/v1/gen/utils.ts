/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { DocumentModelUtils } from 'document-model';
import { baseCreateDocument, baseLoadFromInput, baseSaveToFileHandle, defaultBaseState, generateId } from 'document-model';
import { assertIsChatSessionDocument, assertIsChatSessionState, isChatSessionDocument, isChatSessionState } from './document-schema.js';
import { chatSessionDocumentType } from './document-type.js';
import { reducer } from './reducer.js';
import type { ChatSessionGlobalState, ChatSessionLocalState, ChatSessionPHState } from './types.js';

export const initialGlobalState: ChatSessionGlobalState = {
  threadId: null,
  resourceId: null,
  agent: null,
  status: 'ACTIVE',
  startedAt: null,
  endedAt: null,
  messages: [],
  usage: null,
};
export const initialLocalState: ChatSessionLocalState = {};

export const utils: DocumentModelUtils<ChatSessionPHState> = {
  fileExtension: 'chat',
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    const document = baseCreateDocument(utils.createState, state);

    document.header.documentType = chatSessionDocumentType;

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
    return isChatSessionState(state);
  },
  assertIsStateOfType(state) {
    return assertIsChatSessionState(state);
  },
  isDocumentOfType(document) {
    return isChatSessionDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsChatSessionDocument(document);
  },
};
