import type { DocumentModelUtils } from "document-model";
import type { PhClintProjectPHState } from "./gen/types.js";
import { utils as genUtils } from "./gen/utils.js";
import * as customUtils from "./src/utils.js";

/** Utils for the PhClintProject document model */
export const utils: DocumentModelUtils<PhClintProjectPHState> = {
  ...genUtils,
  ...customUtils,
};
