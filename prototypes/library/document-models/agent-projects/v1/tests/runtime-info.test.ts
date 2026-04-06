import { generateMock } from "@powerhousedao/common/utils";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAgentProjectsDocument,
  updateRuntimeInfo,
  UpdateRuntimeInfoInputSchema,
} from "@powerhousedao/agent-manager/document-models/agent-projects/v1";

describe("RuntimeInfoOperations", () => {
  it("should handle updateRuntimeInfo operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateRuntimeInfoInputSchema());

    const updatedDocument = reducer(document, updateRuntimeInfo(input));

    expect(isAgentProjectsDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_RUNTIME_INFO",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
