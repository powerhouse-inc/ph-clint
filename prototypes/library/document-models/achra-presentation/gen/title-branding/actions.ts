import { type Action } from "document-model";
import type {
  AddLinkInput,
  UpdateLinkInput,
  DeleteLinkInput,
  ReorderLinksInput,
} from "../types.js";

export type AddLinkAction = Action & { type: "ADD_LINK"; input: AddLinkInput };
export type UpdateLinkAction = Action & {
  type: "UPDATE_LINK";
  input: UpdateLinkInput;
};
export type DeleteLinkAction = Action & {
  type: "DELETE_LINK";
  input: DeleteLinkInput;
};
export type ReorderLinksAction = Action & {
  type: "REORDER_LINKS";
  input: ReorderLinksInput;
};

export type AchraPresentationTitleBrandingAction =
  | AddLinkAction
  | UpdateLinkAction
  | DeleteLinkAction
  | ReorderLinksAction;
