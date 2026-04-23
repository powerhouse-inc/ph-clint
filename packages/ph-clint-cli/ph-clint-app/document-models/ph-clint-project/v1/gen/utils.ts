import type { DocumentModelUtils } from 'document-model';
import { baseCreateDocument, baseSaveToFileHandle, baseLoadFromInput, defaultBaseState, generateId } from 'document-model';
import { reducer } from './reducer.js';
import { phClintProjectDocumentType } from './document-type.js';
import { assertIsPhClintProjectDocument, assertIsPhClintProjectState, isPhClintProjectDocument, isPhClintProjectState } from './document-schema.js';
import type { PhClintProjectGlobalState, PhClintProjectLocalState, PhClintProjectPHState } from './types.js';

export const initialGlobalState: PhClintProjectGlobalState = {
  name: null,
  scope: null,
  version: '0.1.0',
  description: '',
  bin: null,
  features: {
    powerhouse: 'Disabled',
    mastra: { enabled: false },
    routine: { enabled: false },
  },
  packages: [],
  externalSkills: [],
  publishHistory: [],
};
export const initialLocalState: PhClintProjectLocalState = {};

export const utils: DocumentModelUtils<PhClintProjectPHState> = {
  fileExtension: 'pcp',
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    const document = baseCreateDocument(utils.createState, state);

    document.header.documentType = phClintProjectDocumentType;

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
    return isPhClintProjectState(state);
  },
  assertIsStateOfType(state) {
    return assertIsPhClintProjectState(state);
  },
  isDocumentOfType(document) {
    return isPhClintProjectDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsPhClintProjectDocument(document);
  },
};
