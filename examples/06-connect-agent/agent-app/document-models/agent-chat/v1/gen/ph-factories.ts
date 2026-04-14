/**
 * Factory methods for creating AgentChatDocument instances
 */
import type { PHAuthState, PHDocumentState, PHBaseState } from "document-model";
import { createBaseState, defaultBaseState } from "document-model";
import type {
  AgentChatDocument,
  AgentChatGlobalState,
  AgentChatLocalState,
  AgentChatPHState,
} from "./types.js";
import { utils } from "./utils.js";

export function defaultGlobalState(): AgentChatGlobalState {
  return {
    topic: null,
    agents: [],
    stakeholders: [],
    messages: [],
    pruneLength: null,
  };
}

export function defaultLocalState(): AgentChatLocalState {
  return {};
}

export function defaultPHState(): AgentChatPHState {
  return {
    ...defaultBaseState(),
    global: defaultGlobalState(),
    local: defaultLocalState(),
  };
}

export function createGlobalState(
  state?: Partial<AgentChatGlobalState>,
): AgentChatGlobalState {
  return {
    ...defaultGlobalState(),
    ...(state || {}),
  } as AgentChatGlobalState;
}

export function createLocalState(
  state?: Partial<AgentChatLocalState>,
): AgentChatLocalState {
  return {
    ...defaultLocalState(),
    ...(state || {}),
  } as AgentChatLocalState;
}

export function createState(
  baseState?: Partial<PHBaseState>,
  globalState?: Partial<AgentChatGlobalState>,
  localState?: Partial<AgentChatLocalState>,
): AgentChatPHState {
  return {
    ...createBaseState(baseState?.auth, baseState?.document),
    global: createGlobalState(globalState),
    local: createLocalState(localState),
  };
}

/**
 * Creates a AgentChatDocument with custom global and local state
 * This properly handles the PHBaseState requirements while allowing
 * document-specific state to be set.
 */
export function createAgentChatDocument(
  state?: Partial<{
    auth?: Partial<PHAuthState>;
    document?: Partial<PHDocumentState>;
    global?: Partial<AgentChatGlobalState>;
    local?: Partial<AgentChatLocalState>;
  }>,
): AgentChatDocument {
  const document = utils.createDocument(
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
