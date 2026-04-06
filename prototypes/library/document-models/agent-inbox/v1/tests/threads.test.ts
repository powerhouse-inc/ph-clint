import { generateMock } from "@powerhousedao/common/utils";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAgentInboxDocument,
  createThread,
  sendAgentMessage,
  setThreadTopic,
  editMessageContent,
  markMessageRead,
  markMessageUnread,
  sendStakeholderMessage,
  CreateThreadInputSchema,
  SendAgentMessageInputSchema,
  SetThreadTopicInputSchema,
  EditMessageContentInputSchema,
  MarkMessageReadInputSchema,
  MarkMessageUnreadInputSchema,
  SendStakeholderMessageInputSchema,
} from "@powerhousedao/agent-manager/document-models/agent-inbox/v1";

describe("ThreadsOperations", () => {
  it("should handle createThread operation", () => {
    const document = utils.createDocument();
    const input = generateMock(CreateThreadInputSchema());

    const updatedDocument = reducer(document, createThread(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CREATE_THREAD",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle sendAgentMessage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SendAgentMessageInputSchema());

    const updatedDocument = reducer(document, sendAgentMessage(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SEND_AGENT_MESSAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setThreadTopic operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetThreadTopicInputSchema());

    const updatedDocument = reducer(document, setThreadTopic(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_THREAD_TOPIC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle editMessageContent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(EditMessageContentInputSchema());

    const updatedDocument = reducer(document, editMessageContent(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "EDIT_MESSAGE_CONTENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle markMessageRead operation", () => {
    const document = utils.createDocument();
    const input = generateMock(MarkMessageReadInputSchema());

    const updatedDocument = reducer(document, markMessageRead(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "MARK_MESSAGE_READ",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle markMessageUnread operation", () => {
    const document = utils.createDocument();
    const input = generateMock(MarkMessageUnreadInputSchema());

    const updatedDocument = reducer(document, markMessageUnread(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "MARK_MESSAGE_UNREAD",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle sendStakeholderMessage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SendStakeholderMessageInputSchema());

    const updatedDocument = reducer(document, sendStakeholderMessage(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SEND_STAKEHOLDER_MESSAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
