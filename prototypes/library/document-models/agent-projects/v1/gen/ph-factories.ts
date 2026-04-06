/**
 * Factory methods for creating AgentProjectsDocument instances
 */
import type { PHAuthState, PHDocumentState, PHBaseState } from "document-model";
import { createBaseState, defaultBaseState } from "document-model/core";
import type {
  AgentProjectsDocument,
  AgentProjectsLocalState,
  AgentProjectsGlobalState,
  AgentProjectsPHState,
} from "./types.js";
import { createDocument } from "./utils.js";

export function defaultGlobalState(): AgentProjectsGlobalState {
  return {
    projects: [],
  };
}

export function defaultLocalState(): AgentProjectsLocalState {
  return {};
}

export function defaultPHState(): AgentProjectsPHState {
  return {
    ...defaultBaseState(),
    global: defaultGlobalState(),
    local: defaultLocalState(),
  };
}

export function createGlobalState(
  state?: Partial<AgentProjectsGlobalState>,
): AgentProjectsGlobalState {
  return {
    ...defaultGlobalState(),
    ...(state || {}),
  } as AgentProjectsGlobalState;
}

export function createLocalState(
  state?: Partial<AgentProjectsLocalState>,
): AgentProjectsLocalState {
  return {
    ...defaultLocalState(),
    ...(state || {}),
  } as AgentProjectsLocalState;
}

export function createState(
  baseState?: Partial<PHBaseState>,
  globalState?: Partial<AgentProjectsGlobalState>,
  localState?: Partial<AgentProjectsLocalState>,
): AgentProjectsPHState {
  return {
    ...createBaseState(baseState?.auth, baseState?.document),
    global: createGlobalState(globalState),
    local: createLocalState(localState),
  };
}

/**
 * Creates a AgentProjectsDocument with custom global and local state
 * This properly handles the PHBaseState requirements while allowing
 * document-specific state to be set.
 */
export function createAgentProjectsDocument(
  state?: Partial<{
    auth?: Partial<PHAuthState>;
    document?: Partial<PHDocumentState>;
    global?: Partial<AgentProjectsGlobalState>;
    local?: Partial<AgentProjectsLocalState>;
  }>,
): AgentProjectsDocument {
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
