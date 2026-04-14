import { PHDocumentController } from "document-model/core";
import { AchraPresentation } from "../module.js";
import type {
  AchraPresentationAction,
  AchraPresentationPHState,
} from "./types.js";

export const AchraPresentationController =
  PHDocumentController.forDocumentModel<
    AchraPresentationPHState,
    AchraPresentationAction
  >(AchraPresentation);
