/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 * Factory methods for creating PhClintProjectDocument instances
 */
import type { PHAuthState, PHBaseState, PHDocumentState } from "document-model";
import { createBaseState, defaultBaseState } from "document-model";
import type {
  PhClintProjectDocument,
  PhClintProjectGlobalState,
  PhClintProjectLocalState,
  PhClintProjectPHState,
} from "./types.js";
import { utils } from "./utils.js";

export function defaultGlobalState(): PhClintProjectGlobalState {
  return {
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
}

export function defaultLocalState(): PhClintProjectLocalState {
  return {};
}

export function defaultPHState(): PhClintProjectPHState {
  return {
    ...defaultBaseState(),
    global: defaultGlobalState(),
    local: defaultLocalState(),
  };
}

export function createGlobalState(
  state?: Partial<PhClintProjectGlobalState>,
): PhClintProjectGlobalState {
  return {
    ...defaultGlobalState(),
    ...(state || {}),
  };
}

export function createLocalState(
  state?: Partial<PhClintProjectLocalState>,
): PhClintProjectLocalState {
  return {
    ...defaultLocalState(),
    ...(state || {}),
  } as PhClintProjectLocalState;
}

export function createState(
  baseState?: Partial<PHBaseState>,
  globalState?: Partial<PhClintProjectGlobalState>,
  localState?: Partial<PhClintProjectLocalState>,
): PhClintProjectPHState {
  return {
    ...createBaseState(baseState?.auth, baseState?.document),
    global: createGlobalState(globalState),
    local: createLocalState(localState),
  };
}

/**
 * Creates a PhClintProjectDocument with custom global and local state
 * This properly handles the PHBaseState requirements while allowing
 * document-specific state to be set.
 */
export function createPhClintProjectDocument(
  state?: Partial<{
    auth?: Partial<PHAuthState>;
    document?: Partial<PHDocumentState>;
    global?: Partial<PhClintProjectGlobalState>;
    local?: Partial<PhClintProjectLocalState>;
  }>,
): PhClintProjectDocument {
  const document = utils.createDocument(
    createState(
      createBaseState(state?.auth, { version: 1, ...state?.document }),
      state?.global,
      state?.local,
    ),
  );

  return document;
}
