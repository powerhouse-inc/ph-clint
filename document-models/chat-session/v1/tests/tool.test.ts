import {
  addToolResult,
  reducer,
  startSession,
  utils,
} from "document-models/chat-session/v1";
import { describe, expect, it } from "vitest";

describe("ToolOperations", () => {
  it("addToolResult maps all content fields correctly", () => {
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
      addToolResult({
        id: "msg-t",
        stepIndex: 2,
        content: [
          {
            id: "p1",
            type: "TOOL_RESULT",
            toolCallId: "tc-1",
            toolName: "search",
            result: '{"data":"ok"}',
            isError: false,
          },
          {
            id: "p2",
            type: "IMAGE",
            toolCallId: "tc-1",
            toolName: "search",
            mediaType: "image/png",
            url: "https://example.com/chart.png",
            data: "base64data",
          },
        ],
        createdAt: "2025-01-01T00:00:01Z",
      }),
    );

    const msg = doc.state.global.messages[0];
    expect(msg.role).toBe("TOOL");
    expect(msg.stepIndex).toBe(2);
    expect(msg.content).toHaveLength(2);

    // first part: tool result with all fields
    const p1 = msg.content[0];
    expect(p1.type).toBe("TOOL_RESULT");
    expect(p1.toolCallId).toBe("tc-1");
    expect(p1.result).toBe('{"data":"ok"}');
    expect(p1.isError).toBe(false);
    expect(p1.args).toBeNull();
    expect(p1.filename).toBeNull();

    // second part: image attached to tool result
    const p2 = msg.content[1];
    expect(p2.type).toBe("IMAGE");
    expect(p2.mediaType).toBe("image/png");
    expect(p2.data).toBe("base64data");

    // usage counter incremented
    expect(doc.state.global.usage!.totalMessages).toBe(1);
  });
});
