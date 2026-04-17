import type { DocumentModelModule } from "document-model";
import { createState, defaultBaseState } from "document-model";
import type { PhClintProjectPHState } from "./gen/types.js";
import { documentModel } from "./gen/document-model.js";
import { reducer } from "./gen/reducer.js";
import { actions } from "./actions.js";
import { utils } from "./utils.js";

/** Document model module for the PhClintProject document type */
export const PhClintProject = {
  version: 1,
  reducer,
  actions,
  utils,
  documentModel: createState(defaultBaseState(), documentModel),
} as const satisfies DocumentModelModule<PhClintProjectPHState>;
