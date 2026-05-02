import {
  addAssistantMessage,
  addSystemMessage,
  addToolOutput,
  addToolResult,
  addUserMessage,
  appendAssistantContent,
  deleteUserMessage,
  endSession,
  reducer,
  setMessageUsage,
  startSession,
  updateAssistantContent,
  updateUsageSummary,
  utils,
} from "document-models/chat-session/v1";
import { describe, expect, it } from "vitest";

describe("AgentOperations", () => {
  it("full conversation flow with usage tracking", () => {
    let doc = reducer(
      utils.createDocument(),
      startSession({
        threadId: "thread-1",
        resourceId: "res-1",
        startedAt: "2025-01-01T00:00:00Z",
        agent: { id: "agent-1", name: "TestBot", model: "gpt-4" },
      }),
    );

    // system message
    doc = reducer(
      doc,
      addSystemMessage({
        id: "msg-sys",
        text: "You are a helpful assistant.",
        createdAt: "2025-01-01T00:00:01Z",
      }),
    );

    // two user messages, then delete the first
    doc = reducer(
      doc,
      addUserMessage({
        id: "msg-u1",
        content: [{ id: "p-u1", type: "TEXT", text: "hello" }],
        createdAt: "2025-01-01T00:00:02Z",
      }),
    );
    doc = reducer(
      doc,
      addUserMessage({
        id: "msg-u2",
        content: [
          { id: "p-u2a", type: "TEXT", text: "actually this" },
          {
            id: "p-u2b",
            type: "IMAGE",
            mediaType: "image/png",
            url: "https://example.com/img.png",
          },
        ],
        createdAt: "2025-01-01T00:00:03Z",
      }),
    );
    doc = reducer(doc, deleteUserMessage({ messageId: "msg-u1" }));

    // assistant message with text + tool call
    doc = reducer(
      doc,
      addAssistantMessage({
        id: "msg-a1",
        stepIndex: 1,
        content: [
          { id: "p-a1-text", type: "TEXT", text: "Let me look that up." },
          {
            id: "p-a1-tc",
            type: "TOOL_CALL",
            toolCallId: "tc-1",
            toolName: "search",
            args: '{"q":"test"}',
          },
        ],
        createdAt: "2025-01-01T00:00:04Z",
      }),
    );

    // append another tool call to the assistant message
    doc = reducer(
      doc,
      appendAssistantContent({
        messageId: "msg-a1",
        part: {
          id: "p-a1-tc2",
          type: "TOOL_CALL",
          toolCallId: "tc-2",
          toolName: "fetch",
          args: '{"url":"https://example.com"}',
        },
      }),
    );

    // tool result
    doc = reducer(
      doc,
      addToolResult({
        id: "msg-t1",
        stepIndex: 1,
        content: [
          {
            id: "p-t1",
            type: "TOOL_RESULT",
            toolCallId: "tc-1",
            toolName: "search",
            result: '{"results":[]}',
          },
        ],
        createdAt: "2025-01-01T00:00:05Z",
      }),
    );

    // progressive tool output on the tool result message
    doc = reducer(
      doc,
      addToolOutput({
        messageId: "msg-t1",
        partId: "p-t1-out",
        text: "Streaming output chunk",
        toolCallId: "tc-1",
        toolName: "search",
      }),
    );

    // update the assistant's text part
    doc = reducer(
      doc,
      updateAssistantContent({
        messageId: "msg-a1",
        partId: "p-a1-text",
        text: "Here are the results.",
      }),
    );

    // update args and error on a tool call part
    doc = reducer(
      doc,
      updateAssistantContent({
        messageId: "msg-a1",
        partId: "p-a1-tc",
        args: '{"q":"updated"}',
        error: "timeout",
      }),
    );

    // set per-message usage
    doc = reducer(
      doc,
      setMessageUsage({
        messageId: "msg-a1",
        promptTokens: 150,
        completionTokens: 42,
        totalTokens: 192,
      }),
    );

    // usage summary update with all fields
    doc = reducer(
      doc,
      updateUsageSummary({
        totalPromptTokens: 500,
        totalCompletionTokens: 200,
        totalTokens: 700,
        totalSteps: 3,
        totalMessages: 4,
        totalToolCalls: 2,
      }),
    );

    // end session
    doc = reducer(
      doc,
      endSession({
        status: "COMPLETED",
        endedAt: "2025-01-01T00:01:00Z",
      }),
    );

    const s = doc.state.global;

    // session metadata
    expect(s.status).toBe("COMPLETED");
    expect(s.threadId).toBe("thread-1");
    expect(s.endedAt).toBe("2025-01-01T00:01:00Z");
    expect(s.agent?.name).toBe("TestBot");

    // messages: sys + u2 (u1 deleted) + a1 + t1 = 4
    expect(s.messages).toHaveLength(4);
    expect(s.messages.map((m) => m.role)).toEqual([
      "SYSTEM",
      "USER",
      "ASSISTANT",
      "TOOL",
    ]);

    // user message u2 has 2 parts including image
    const u2 = s.messages[1];
    expect(u2.content).toHaveLength(2);
    expect(u2.content[1].type).toBe("IMAGE");
    expect(u2.content[1].mediaType).toBe("image/png");
    expect(u2.content[1].toolCallId).toBeNull();

    // assistant message has 3 parts (text + 2 tool calls) after append
    const a1 = s.messages[2];
    expect(a1.content).toHaveLength(3);
    expect(a1.stepIndex).toBe(1);
    expect(a1.content[0].text).toBe("Here are the results."); // updated via updateAssistantContent
    expect(a1.content[1].args).toBe('{"q":"updated"}'); // updated
    expect(a1.content[1].error).toBe("timeout"); // updated
    expect(a1.content[1].type).toBe("TOOL_CALL");
    expect(a1.content[2].toolCallId).toBe("tc-2"); // appended

    // per-message usage
    expect(a1.usage).toStrictEqual({
      promptTokens: 150,
      completionTokens: 42,
      totalTokens: 192,
    });

    // tool message has original part + appended output = 2 parts
    const t1 = s.messages[3];
    expect(t1.content).toHaveLength(2);
    expect(t1.content[0].type).toBe("TOOL_RESULT");
    expect(t1.content[1].text).toBe("Streaming output chunk");

    // usage: all fields overwritten by updateUsageSummary
    expect(s.usage).toStrictEqual({
      totalPromptTokens: 500,
      totalCompletionTokens: 200,
      totalTokens: 700,
      totalSteps: 3,
      totalMessages: 4,
      totalToolCalls: 2,
    });
  });

  it("preserves falsy values (0, false) via nullish coalescing", () => {
    let doc = reducer(
      utils.createDocument(),
      startSession({
        threadId: "t",
        resourceId: "r",
        startedAt: "2025-01-01T00:00:00Z",
        agent: { name: "Bot" },
      }),
    );

    // stepIndex: 0 is valid (first step)
    doc = reducer(
      doc,
      addAssistantMessage({
        id: "msg-a",
        stepIndex: 0,
        content: [{ id: "p1", type: "TEXT", text: "hi" }],
        createdAt: "2025-01-01T00:00:01Z",
      }),
    );

    // isError: false and stepIndex: 0 are valid
    doc = reducer(
      doc,
      addToolResult({
        id: "msg-t",
        stepIndex: 0,
        content: [
          {
            id: "p-t1",
            type: "TOOL_RESULT",
            toolCallId: "tc-1",
            toolName: "search",
            result: "ok",
            isError: false,
          },
        ],
        createdAt: "2025-01-01T00:00:02Z",
      }),
    );

    // token counts of 0 are valid
    doc = reducer(
      doc,
      setMessageUsage({
        messageId: "msg-a",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      }),
    );

    const a = doc.state.global.messages[0];
    expect(a.stepIndex).toBe(0);
    expect(a.usage!.promptTokens).toBe(0);
    expect(a.usage!.completionTokens).toBe(0);
    expect(a.usage!.totalTokens).toBe(0);

    const t = doc.state.global.messages[1];
    expect(t.stepIndex).toBe(0);
    expect(t.content[0].isError).toBe(false);
  });
});
