import { PHDocumentController } from "document-model";
import { AgentChat } from "../module.js";
import type { AgentChatAction, AgentChatPHState } from "./types.js";

export const AgentChatController = PHDocumentController.forDocumentModel<
  AgentChatPHState,
  AgentChatAction
>(AgentChat);
