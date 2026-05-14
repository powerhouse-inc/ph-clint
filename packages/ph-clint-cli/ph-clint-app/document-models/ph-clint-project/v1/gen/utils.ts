/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { DocumentModelUtils } from "document-model";
import {
  baseCreateDocument,
  baseLoadFromInput,
  baseSaveToFileHandle,
  defaultBaseState,
  generateId,
} from "document-model";
import {
  assertIsPhClintProjectDocument,
  assertIsPhClintProjectState,
  isPhClintProjectDocument,
  isPhClintProjectState,
} from "./document-schema.js";
import { phClintProjectDocumentType } from "./document-type.js";
import { reducer } from "./reducer.js";
import type {
  PhClintProjectGlobalState,
  PhClintProjectLocalState,
  PhClintProjectPHState,
} from "./types.js";

export const initialGlobalState: PhClintProjectGlobalState = {
  name: null,
  scope: null,
  version: "0.1.0",
  description: "",
  features: {
    powerhouse: "Disabled",
    mastra: {
      enabled: false,
      mainAgent: null,
      subAgents: [],
      models: [],
      profiles: [],
      common: { enableChat: false },
    },
    routine: { enabled: false },
  },
  packages: [],
  externalSkills: [],
  publishHistory: [],
  deployment: {
    proxyEnabled: false,
    observabilityEnabled: false,
    supportedResources: [
      "vetra-agent-s",
      "vetra-agent-m",
      "vetra-agent-l",
      "vetra-agent-xl",
      "vetra-agent-xxl",
    ],
  },
};
export const initialLocalState: PhClintProjectLocalState = {};

export const utils: DocumentModelUtils<PhClintProjectPHState> = {
  fileExtension: "pcp",
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
