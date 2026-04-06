/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateMock } from "@powerhousedao/codegen";
import {
  reducer,
  utils,
  isAgentInboxDocument,
  proposeThreadResolved,
  ProposeThreadResolvedInputSchema,
  confirmThreadResolved,
  ConfirmThreadResolvedInputSchema,
  archiveThread,
  ArchiveThreadInputSchema,
  reopenThread,
  ReopenThreadInputSchema,
} from "@powerhousedao/agent-manager/document-models/agent-inbox";

describe("Workflow Operations", () => {
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
});
