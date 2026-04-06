import { PHDocumentController } from "document-model/core";
import { WorkBreakdownStructure } from "../module.js";
import type {
  WorkBreakdownStructureAction,
  WorkBreakdownStructurePHState,
} from "./types.js";

export const WorkBreakdownStructureController =
  PHDocumentController.forDocumentModel<
    WorkBreakdownStructurePHState,
    WorkBreakdownStructureAction
  >(WorkBreakdownStructure);
