/**
 * Factory methods for creating AgentInboxDocument instances
 */
import type { PHAuthState, PHDocumentState, PHBaseState } from "document-model";
import { createBaseState, defaultBaseState } from "document-model/core";
import type {
  AgentInboxDocument,
  AgentInboxLocalState,
  AgentInboxGlobalState,
  AgentInboxPHState,
} from "./types.js";
import { createDocument } from "./utils.js";

export function defaultGlobalState(): AgentInboxGlobalState {
  return {
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
}

export function defaultLocalState(): AgentInboxLocalState {
  return {};
}

export function defaultPHState(): AgentInboxPHState {
  return {
    ...defaultBaseState(),
    global: defaultGlobalState(),
    local: defaultLocalState(),
  };
}

export function createGlobalState(
  state?: Partial<AgentInboxGlobalState>,
): AgentInboxGlobalState {
  return {
    ...defaultGlobalState(),
    ...(state || {}),
  } as AgentInboxGlobalState;
}

export function createLocalState(
  state?: Partial<AgentInboxLocalState>,
): AgentInboxLocalState {
  return {
    ...defaultLocalState(),
    ...(state || {}),
  } as AgentInboxLocalState;
}

export function createState(
  baseState?: Partial<PHBaseState>,
  globalState?: Partial<AgentInboxGlobalState>,
  localState?: Partial<AgentInboxLocalState>,
): AgentInboxPHState {
  return {
    ...createBaseState(baseState?.auth, baseState?.document),
    global: createGlobalState(globalState),
    local: createLocalState(localState),
  };
}

/**
 * Creates a AgentInboxDocument with custom global and local state
 * This properly handles the PHBaseState requirements while allowing
 * document-specific state to be set.
 */
export function createAgentInboxDocument(
  state?: Partial<{
    auth?: Partial<PHAuthState>;
    document?: Partial<PHDocumentState>;
    global?: Partial<AgentInboxGlobalState>;
    local?: Partial<AgentInboxLocalState>;
  }>,
): AgentInboxDocument {
  const document = createDocument(
    state
      ? createState(
          createBaseState(state.auth, state.document),
          state.global,
          state.local,
        )
      : undefined,
  );

  return document;
}
