import { PHDocumentController } from "document-model";
import { PhClintProject } from "../module.js";
import type { PhClintProjectAction, PhClintProjectPHState } from "./types.js";

export const PhClintProjectController = PHDocumentController.forDocumentModel<
  PhClintProjectPHState,
  PhClintProjectAction
>(PhClintProject);
