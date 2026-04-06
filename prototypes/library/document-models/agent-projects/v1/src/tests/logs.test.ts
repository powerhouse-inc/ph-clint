/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateMock } from "@powerhousedao/codegen";
import {
  reducer,
  utils,
  isAgentProjectsDocument,
  addLogEntry,
  AddLogEntryInputSchema,
  clearProjectLogs,
  ClearProjectLogsInputSchema,
} from "@powerhousedao/agent-manager/document-models/agent-projects";

describe("Logs Operations", () => {
  it("should handle addLogEntry operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddLogEntryInputSchema());

    const updatedDocument = reducer(document, addLogEntry(input));

    expect(isAgentProjectsDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_LOG_ENTRY",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle clearProjectLogs operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearProjectLogsInputSchema());

    const updatedDocument = reducer(document, clearProjectLogs(input));

    expect(isAgentProjectsDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_PROJECT_LOGS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
