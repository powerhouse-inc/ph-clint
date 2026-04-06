import { baseActions } from "document-model";
import {
  documentationActions,
  hierarchyActions,
  workflowActions,
  metadataActions,
} from "./gen/creators.js";

/** Actions for the WorkBreakdownStructure document model */

export const actions = {
  ...baseActions,
  ...documentationActions,
  ...hierarchyActions,
  ...workflowActions,
  ...metadataActions,
};
