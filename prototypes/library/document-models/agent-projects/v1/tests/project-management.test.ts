import { generateMock } from "@powerhousedao/common/utils";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAgentProjectsDocument,
  registerProject,
  updateProjectConfig,
  updateProjectStatus,
  RegisterProjectInputSchema,
  UpdateProjectConfigInputSchema,
  UpdateProjectStatusInputSchema,
} from "@powerhousedao/agent-manager/document-models/agent-projects/v1";

describe("ProjectManagementOperations", () => {
  it("should handle registerProject operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RegisterProjectInputSchema());

    const updatedDocument = reducer(document, registerProject(input));

    expect(isAgentProjectsDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REGISTER_PROJECT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateProjectConfig operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateProjectConfigInputSchema());

    const updatedDocument = reducer(document, updateProjectConfig(input));

    expect(isAgentProjectsDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_PROJECT_CONFIG",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateProjectStatus operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateProjectStatusInputSchema());

    const updatedDocument = reducer(document, updateProjectStatus(input));

    expect(isAgentProjectsDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_PROJECT_STATUS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
