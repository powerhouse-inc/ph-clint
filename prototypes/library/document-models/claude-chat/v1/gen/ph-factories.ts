/**
 * Factory methods for creating ClaudeChatDocument instances
 */
import type { PHAuthState, PHDocumentState, PHBaseState } from "document-model";
import { createBaseState, defaultBaseState } from "document-model/core";
import type {
  ClaudeChatDocument,
  ClaudeChatLocalState,
  ClaudeChatGlobalState,
  ClaudeChatPHState,
} from "./types.js";
import { createDocument } from "./utils.js";

export function defaultGlobalState(): ClaudeChatGlobalState {
  return {
    username: "",
    agents: [],
    messages: [],
    selectedAgent: null,
  };
}

export function defaultLocalState(): ClaudeChatLocalState {
  return {};
}

export function defaultPHState(): ClaudeChatPHState {
  return {
    ...defaultBaseState(),
    global: defaultGlobalState(),
    local: defaultLocalState(),
  };
}

export function createGlobalState(
  state?: Partial<ClaudeChatGlobalState>,
): ClaudeChatGlobalState {
  return {
    ...defaultGlobalState(),
    ...(state || {}),
  } as ClaudeChatGlobalState;
}

export function createLocalState(
  state?: Partial<ClaudeChatLocalState>,
): ClaudeChatLocalState {
  return {
    ...defaultLocalState(),
    ...(state || {}),
  } as ClaudeChatLocalState;
}

export function createState(
  baseState?: Partial<PHBaseState>,
  globalState?: Partial<ClaudeChatGlobalState>,
  localState?: Partial<ClaudeChatLocalState>,
): ClaudeChatPHState {
  return {
    ...createBaseState(baseState?.auth, baseState?.document),
    global: createGlobalState(globalState),
    local: createLocalState(localState),
  };
}

/**
 * Creates a ClaudeChatDocument with custom global and local state
 * This properly handles the PHBaseState requirements while allowing
 * document-specific state to be set.
 */
export function createClaudeChatDocument(
  state?: Partial<{
    auth?: Partial<PHAuthState>;
    document?: Partial<PHDocumentState>;
    global?: Partial<ClaudeChatGlobalState>;
    local?: Partial<ClaudeChatLocalState>;
  }>,
): ClaudeChatDocument {
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
