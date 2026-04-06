import type { DocumentModelModule } from "document-model";
import { createState } from "document-model";
import { defaultBaseState } from "document-model/core";
import type { AchraPresentationPHState } from "@powerhousedao/agent-manager/document-models/achra-presentation";
import {
  actions,
  documentModel,
  reducer,
  utils,
} from "@powerhousedao/agent-manager/document-models/achra-presentation";

/** Document model module for the Todo List document type */
export const AchraPresentation: DocumentModelModule<AchraPresentationPHState> =
  {
    reducer,
    actions,
    utils,
    documentModel: createState(defaultBaseState(), documentModel),
  };
