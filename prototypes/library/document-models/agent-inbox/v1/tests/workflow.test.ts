import { generateMock } from "@powerhousedao/common/utils";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAgentInboxDocument,
  proposeThreadResolved,
  confirmThreadResolved,
  archiveThread,
  reopenThread,
  ProposeThreadResolvedInputSchema,
  ConfirmThreadResolvedInputSchema,
  ArchiveThreadInputSchema,
  ReopenThreadInputSchema,
} from "@powerhousedao/agent-manager/document-models/agent-inbox/v1";

describe("WorkflowOperations", () => {
  it("should handle proposeThreadResolved operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ProposeThreadResolvedInputSchema());

    const updatedDocument = reducer(document, proposeThreadResolved(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "PROPOSE_THREAD_RESOLVED",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle confirmThreadResolved operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ConfirmThreadResolvedInputSchema());

    const updatedDocument = reducer(document, confirmThreadResolved(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CONFIRM_THREAD_RESOLVED",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle archiveThread operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ArchiveThreadInputSchema());

    const updatedDocument = reducer(document, archiveThread(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ARCHIVE_THREAD",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle reopenThread operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReopenThreadInputSchema());

    const updatedDocument = reducer(document, reopenThread(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REOPEN_THREAD",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
