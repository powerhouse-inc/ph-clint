import { PHDocumentController } from "document-model/core";
import { AgentInbox } from "../module.js";
import type { AgentInboxAction, AgentInboxPHState } from "./types.js";

export const AgentInboxController = PHDocumentController.forDocumentModel<
  AgentInboxPHState,
  AgentInboxAction
>(AgentInbox);
