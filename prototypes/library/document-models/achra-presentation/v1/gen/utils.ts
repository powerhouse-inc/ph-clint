import type { DocumentModelUtils } from "document-model";
import {
  baseCreateDocument,
  baseSaveToFileHandle,
  baseLoadFromInput,
  defaultBaseState,
  generateId,
} from "document-model/core";
import type {
  AchraPresentationGlobalState,
  AchraPresentationLocalState,
} from "./types.js";
import type { AchraPresentationPHState } from "./types.js";
import { reducer } from "./reducer.js";
import { achraPresentationDocumentType } from "./document-type.js";
import {
  isAchraPresentationDocument,
  assertIsAchraPresentationDocument,
  isAchraPresentationState,
  assertIsAchraPresentationState,
} from "./document-schema.js";

export const initialGlobalState: AchraPresentationGlobalState = {
  title: "",
  author: "",
  date: "",
  slides: [],
};
export const initialLocalState: AchraPresentationLocalState = {};

export const utils: DocumentModelUtils<AchraPresentationPHState> = {
  fileExtension: "achp",
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    const document = baseCreateDocument(utils.createState, state);

    document.header.documentType = achraPresentationDocumentType;

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
    return isAchraPresentationState(state);
  },
  assertIsStateOfType(state) {
    return assertIsAchraPresentationState(state);
  },
  isDocumentOfType(document) {
    return isAchraPresentationDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsAchraPresentationDocument(document);
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
