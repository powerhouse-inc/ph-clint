import { baseActions } from "document-model";
import {
  coreActions,
  titleBrandingActions,
  structureFlowActions,
  textListsActions,
} from "./gen/creators.js";

/** Actions for the AchraPresentation document model */
export const actions = {
  ...baseActions,
  ...coreActions,
  ...titleBrandingActions,
  ...structureFlowActions,
  ...textListsActions,
};
