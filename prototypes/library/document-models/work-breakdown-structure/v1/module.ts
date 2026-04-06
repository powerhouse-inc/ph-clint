import type { DocumentModelModule } from "document-model";
import { createState } from "document-model";
import { defaultBaseState } from "document-model/core";
import type { WorkBreakdownStructurePHState } from "./gen/types.js";
import { documentModel } from "./gen/document-model.js";
import { reducer } from "./gen/reducer.js";
import { actions } from "./actions.js";
import { utils } from "./utils.js";

/** Document model module for the WorkBreakdownStructure document type */
export const WorkBreakdownStructure: DocumentModelModule<WorkBreakdownStructurePHState> =
  {
    version: 1,
    reducer,
    actions,
    utils,
    documentModel: createState(defaultBaseState(), documentModel),
  };
