/**
 * Factory methods for creating AchraPresentationDocument instances
 */
import type { PHAuthState, PHDocumentState, PHBaseState } from "document-model";
import { createBaseState, defaultBaseState } from "document-model/core";
import type {
  AchraPresentationDocument,
  AchraPresentationLocalState,
  AchraPresentationGlobalState,
  AchraPresentationPHState,
} from "./types.js";
import { createDocument } from "./utils.js";

export function defaultGlobalState(): AchraPresentationGlobalState {
  return { title: "", author: "", date: "", slides: [] };
}

export function defaultLocalState(): AchraPresentationLocalState {
  return {};
}

export function defaultPHState(): AchraPresentationPHState {
  return {
    ...defaultBaseState(),
    global: defaultGlobalState(),
    local: defaultLocalState(),
  };
}

export function createGlobalState(
  state?: Partial<AchraPresentationGlobalState>,
): AchraPresentationGlobalState {
  return {
    ...defaultGlobalState(),
    ...(state || {}),
  } as AchraPresentationGlobalState;
}

export function createLocalState(
  state?: Partial<AchraPresentationLocalState>,
): AchraPresentationLocalState {
  return {
    ...defaultLocalState(),
    ...(state || {}),
  } as AchraPresentationLocalState;
}

export function createState(
  baseState?: Partial<PHBaseState>,
  globalState?: Partial<AchraPresentationGlobalState>,
  localState?: Partial<AchraPresentationLocalState>,
): AchraPresentationPHState {
  return {
    ...createBaseState(baseState?.auth, baseState?.document),
    global: createGlobalState(globalState),
    local: createLocalState(localState),
  };
}

/**
 * Creates a AchraPresentationDocument with custom global and local state
 * This properly handles the PHBaseState requirements while allowing
 * document-specific state to be set.
 */
export function createAchraPresentationDocument(
  state?: Partial<{
    auth?: Partial<PHAuthState>;
    document?: Partial<PHDocumentState>;
    global?: Partial<AchraPresentationGlobalState>;
    local?: Partial<AchraPresentationLocalState>;
  }>,
): AchraPresentationDocument {
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
