import { PHDocumentController } from "document-model/core";
import { ClaudeChat } from "../module.js";
import type { ClaudeChatAction, ClaudeChatPHState } from "./types.js";

export const ClaudeChatController = PHDocumentController.forDocumentModel<
  ClaudeChatPHState,
  ClaudeChatAction
>(ClaudeChat);
