import {
  abortSession,
  addAssistantMessage,
  addToolOutput,
  addUserMessage,
  appendAssistantContent,
  deleteUserMessage,
  reducer,
  setMessageUsage,
  startSession,
  updateAssistantContent,
  utils,
} from "document-models/chat-session/v1";
import { describe, expect, it } from "vitest";

describe("UserOperations", () => {
  it("all error paths: MessageNotFound, NotAssistantMessage, ContentPartNotFound, NotUserMessage", () => {
    // set up: session with one assistant message and one user message
    let doc = reducer(
      utils.createDocument(),
      startSession({
        threadId: "t",
        resourceId: "r",
        startedAt: "2025-01-01T00:00:00Z",
        agent: { name: "Bot" },
      }),
    );
    doc = reducer(
      doc,
      addAssistantMessage({
        id: "msg-a",
        content: [{ id: "part-a", type: "TEXT", text: "hello" }],
        createdAt: "2025-01-01T00:00:01Z",
      }),
    );
    doc = reducer(
      doc,
      addUserMessage({
        id: "msg-u",
        content: [{ id: "part-u", type: "TEXT", text: "hi" }],
        createdAt: "2025-01-01T00:00:02Z",
      }),
    );

    const stateBeforeErrors = doc.state.global;
    let opIdx = 3; // next operation index

    // 1. appendAssistantContent — nonexistent message
    doc = reducer(
      doc,
      appendAssistantContent({
        messageId: "nonexistent",
        part: { id: "x", type: "TEXT", text: "x" },
      }),
    );
    expect(doc.operations.global[opIdx].error).toContain("Message not found");

    // 2. appendAssistantContent — target is USER message
    doc = reducer(
      doc,
      appendAssistantContent({
        messageId: "msg-u",
        part: { id: "x", type: "TEXT", text: "x" },
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain(
      "Can only append to ASSISTANT",
    );

    // 3. updateAssistantContent — valid message, nonexistent part
    doc = reducer(
      doc,
      updateAssistantContent({
        messageId: "msg-a",
        partId: "nonexistent",
        text: "x",
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain(
      "Content part not found",
    );

    // 4. updateAssistantContent — nonexistent message
    doc = reducer(
      doc,
      updateAssistantContent({
        messageId: "nonexistent",
        partId: "x",
        text: "x",
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain("Message not found");

    // 5. setMessageUsage — nonexistent message
    doc = reducer(doc, setMessageUsage({ messageId: "nonexistent" }));
    expect(doc.operations.global[++opIdx].error).toContain("Message not found");

    // 6. deleteUserMessage — nonexistent
    doc = reducer(doc, deleteUserMessage({ messageId: "nonexistent" }));
    expect(doc.operations.global[++opIdx].error).toContain("Message not found");

    // 7. deleteUserMessage — target is ASSISTANT message
    doc = reducer(doc, deleteUserMessage({ messageId: "msg-a" }));
    expect(doc.operations.global[++opIdx].error).toContain(
      "Can only delete USER",
    );

    // 8. addToolOutput — nonexistent message
    doc = reducer(
      doc,
      addToolOutput({
        messageId: "nonexistent",
        partId: "x",
        text: "x",
        toolCallId: "tc",
        toolName: "t",
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain("Message not found");

    // state unchanged through all errors
    expect(doc.state.global.messages).toHaveLength(
      stateBeforeErrors.messages.length,
    );
    expect(doc.state.global.messages).toStrictEqual(
      stateBeforeErrors.messages,
    );

    // abortSession sets status and endedAt
    doc = reducer(doc, abortSession({ endedAt: "2025-01-01T00:01:00Z" }));
    expect(doc.state.global.status).toBe("ABORTED");
    expect(doc.state.global.endedAt).toBe("2025-01-01T00:01:00Z");
  });
});
