import { PHDocumentController } from "document-model/core";
import { AgentProjects } from "../module.js";
import type { AgentProjectsAction, AgentProjectsPHState } from "./types.js";

export const AgentProjectsController = PHDocumentController.forDocumentModel<
  AgentProjectsPHState,
  AgentProjectsAction
>(AgentProjects);
