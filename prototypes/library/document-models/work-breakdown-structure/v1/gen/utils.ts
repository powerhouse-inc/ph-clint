import type { DocumentModelUtils } from "document-model";
import {
  baseCreateDocument,
  baseSaveToFileHandle,
  baseLoadFromInput,
  defaultBaseState,
  generateId,
} from "document-model/core";
import type {
  WorkBreakdownStructureGlobalState,
  WorkBreakdownStructureLocalState,
} from "./types.js";
import type { WorkBreakdownStructurePHState } from "./types.js";
import { reducer } from "./reducer.js";
import { workBreakdownStructureDocumentType } from "./document-type.js";
import {
  isWorkBreakdownStructureDocument,
  assertIsWorkBreakdownStructureDocument,
  isWorkBreakdownStructureState,
  assertIsWorkBreakdownStructureState,
} from "./document-schema.js";

export const initialGlobalState: WorkBreakdownStructureGlobalState = {
  owner: null,
  isBlocked: false,
  goals: [],
  references: [],
  metaData: null,
};
export const initialLocalState: WorkBreakdownStructureLocalState = {};

export const utils: DocumentModelUtils<WorkBreakdownStructurePHState> = {
  fileExtension: ".wbs",
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    const document = baseCreateDocument(utils.createState, state);

    document.header.documentType = workBreakdownStructureDocumentType;

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
    return isWorkBreakdownStructureState(state);
  },
  assertIsStateOfType(state) {
    return assertIsWorkBreakdownStructureState(state);
  },
  isDocumentOfType(document) {
    return isWorkBreakdownStructureDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsWorkBreakdownStructureDocument(document);
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
