import type { DocumentModelUtils } from "document-model";
import type { AgentChatPHState } from "./gen/types.js";
import { utils as genUtils } from "./gen/utils.js";
import * as customUtils from "./src/utils.js";

/** Utils for the AgentChat document model */
export const utils: DocumentModelUtils<AgentChatPHState> = {
  ...genUtils,
  ...customUtils,
};
