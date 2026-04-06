import { createAction } from "document-model/core";
import {
  ProposeThreadResolvedInputSchema,
  ConfirmThreadResolvedInputSchema,
  ArchiveThreadInputSchema,
  ReopenThreadInputSchema,
} from "../schema/zod.js";
import type {
  ProposeThreadResolvedInput,
  ConfirmThreadResolvedInput,
  ArchiveThreadInput,
  ReopenThreadInput,
} from "../types.js";
import type {
  ProposeThreadResolvedAction,
  ConfirmThreadResolvedAction,
  ArchiveThreadAction,
  ReopenThreadAction,
} from "./actions.js";

export const proposeThreadResolved = (input: ProposeThreadResolvedInput) =>
  createAction<ProposeThreadResolvedAction>(
    "PROPOSE_THREAD_RESOLVED",
    { ...input },
    undefined,
    ProposeThreadResolvedInputSchema,
    "global",
  );

export const confirmThreadResolved = (input: ConfirmThreadResolvedInput) =>
  createAction<ConfirmThreadResolvedAction>(
    "CONFIRM_THREAD_RESOLVED",
    { ...input },
    undefined,
    ConfirmThreadResolvedInputSchema,
    "global",
  );

export const archiveThread = (input: ArchiveThreadInput) =>
  createAction<ArchiveThreadAction>(
    "ARCHIVE_THREAD",
    { ...input },
    undefined,
    ArchiveThreadInputSchema,
    "global",
  );

export const reopenThread = (input: ReopenThreadInput) =>
  createAction<ReopenThreadAction>(
    "REOPEN_THREAD",
    { ...input },
    undefined,
    ReopenThreadInputSchema,
    "global",
  );
