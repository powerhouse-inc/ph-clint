import {
  reducer,
  setAgentInfo,
  startSession,
  updateUsageSummary,
  utils,
} from "document-models/chat-session/v1";
import { describe, expect, it } from "vitest";

describe("SystemOperations", () => {
  it("setAgentInfo: partial updates and agent creation branches", () => {
    // on fresh doc, agent is null — should create it
    let doc = reducer(
      utils.createDocument(),
      setAgentInfo({ name: "TestBot" }),
    );

    expect(doc.state.global.agent).toStrictEqual({
      id: null,
      name: "TestBot",
      model: null,
      instructions: null,
    });

    // agent already exists — partial update preserves other fields
    doc = reducer(doc, setAgentInfo({ model: "gpt-4" }));

    expect(doc.state.global.agent).toStrictEqual({
      id: null,
      name: "TestBot",
      model: "gpt-4",
      instructions: null,
    });

    // update id specifically
    doc = reducer(doc, setAgentInfo({ id: "agent-42" }));
    expect(doc.state.global.agent!.id).toBe("agent-42");

    // all-empty input — no fields change
    doc = reducer(doc, setAgentInfo({}));

    expect(doc.state.global.agent).toStrictEqual({
      id: "agent-42",
      name: "TestBot",
      model: "gpt-4",
      instructions: null,
    });

    // startSession with minimal agent — all fields default to null
    let doc3 = reducer(
      utils.createDocument(),
      startSession({
        threadId: "t2",
        resourceId: "r2",
        startedAt: "2025-01-01T00:00:00Z",
        agent: {},
      }),
    );
    expect(doc3.state.global.agent).toStrictEqual({
      id: null,
      name: null,
      model: null,
      instructions: null,
    });

    // also verify the false branch after startSession sets agent
    let doc2 = reducer(
      utils.createDocument(),
      startSession({
        threadId: "t",
        resourceId: "r",
        startedAt: "2025-01-01T00:00:00Z",
        agent: { id: "a1", name: "Bot", model: "m1", instructions: "be nice" },
      }),
    );
    doc2 = reducer(doc2, setAgentInfo({ instructions: "be helpful" }));

    expect(doc2.state.global.agent).toStrictEqual({
      id: "a1",
      name: "Bot",
      model: "m1",
      instructions: "be helpful",
    });
  });

  it("updateUsageSummary: creation from null, partial updates, zero values, all-null no-op", () => {
    // fresh doc has usage: null — should create with zero defaults
    let doc = reducer(
      utils.createDocument(),
      updateUsageSummary({ totalPromptTokens: 100 }),
    );

    expect(doc.state.global.usage).toStrictEqual({
      totalPromptTokens: 100,
      totalCompletionTokens: 0,
      totalTokens: 0,
      totalSteps: 0,
      totalMessages: 0,
      totalToolCalls: 0,
    });

    // partial update — only provided fields change
    doc = reducer(doc, updateUsageSummary({ totalSteps: 5, totalTokens: 999 }));

    expect(doc.state.global.usage!.totalPromptTokens).toBe(100); // unchanged
    expect(doc.state.global.usage!.totalSteps).toBe(5);
    expect(doc.state.global.usage!.totalTokens).toBe(999);

    // explicit 0 overwrites (not skipped)
    doc = reducer(doc, updateUsageSummary({ totalPromptTokens: 0 }));
    expect(doc.state.global.usage!.totalPromptTokens).toBe(0);

    // all-null input — nothing changes
    const before = { ...doc.state.global.usage! };
    doc = reducer(
      doc,
      updateUsageSummary({
        totalPromptTokens: null,
        totalCompletionTokens: null,
        totalTokens: null,
        totalSteps: null,
        totalMessages: null,
        totalToolCalls: null,
      }),
    );
    expect(doc.state.global.usage).toStrictEqual(before);
  });
});
