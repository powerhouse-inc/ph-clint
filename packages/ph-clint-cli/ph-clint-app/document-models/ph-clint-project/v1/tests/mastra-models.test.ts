import {
  addModel,
  addSubAgent,
  enableMastra,
  reducer,
  removeModel,
  setAgentModel,
  utils,
  type PhClintProjectDocument,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

function enabled(): PhClintProjectDocument {
  return reducer(
    utils.createDocument(),
    enableMastra({ agentId: "main", agentName: "Main" }),
  );
}

describe("MastraModelsOperations", () => {
  describe("ADD_MODEL", () => {
    it("adds a provider/name model", () => {
      let doc = enabled();
      doc = reducer(doc, addModel({ id: "anthropic/claude-sonnet-4-5" }));
      expect(doc.state.global.features.mastra.models).toContainEqual({
        id: "anthropic/claude-sonnet-4-5",
      });
    });

    it("rejects mismatched model id format", () => {
      const doc = reducer(enabled(), addModel({ id: "no-slash" }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("provider/model-name format");
    });

    it("rejects duplicates", () => {
      let doc = enabled();
      doc = reducer(doc, addModel({ id: "anthropic/claude-sonnet-4-5" }));
      doc = reducer(doc, addModel({ id: "anthropic/claude-sonnet-4-5" }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("already exists");
    });

    it("rejects when mastra is disabled", () => {
      const doc = reducer(
        utils.createDocument(),
        addModel({ id: "anthropic/claude-sonnet-4-5" }),
      );
      expect(doc.operations.global[0].error).toContain("Mastra is disabled");
    });
  });

  describe("REMOVE_MODEL", () => {
    it("rejects when in use by the main agent", () => {
      const doc = reducer(enabled(), removeModel({ id: "clint/demo-agent" }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("in use");
      expect(doc.state.global.features.mastra.models).toHaveLength(1);
    });

    it("rejects when in use by a sub-agent", () => {
      let doc = enabled();
      doc = reducer(doc, addModel({ id: "openai/gpt-4o" }));
      doc = reducer(
        doc,
        addSubAgent({
          id: "sub",
          name: "Sub",
          description: "A sub.",
          modelId: "openai/gpt-4o",
        }),
      );
      doc = reducer(doc, removeModel({ id: "openai/gpt-4o" }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("in use");
    });

    it("removes an unused model", () => {
      let doc = enabled();
      doc = reducer(doc, addModel({ id: "openai/gpt-4o" }));
      doc = reducer(
        doc,
        setAgentModel({ agentId: "main", modelId: "openai/gpt-4o" }),
      );
      doc = reducer(doc, removeModel({ id: "clint/demo-agent" }));
      const models = doc.state.global.features.mastra.models;
      expect(models.find((m) => m.id === "clint/demo-agent")).toBeUndefined();
      expect(models).toEqual([{ id: "openai/gpt-4o" }]);
    });

    it("rejects when model id is not found", () => {
      const doc = reducer(enabled(), removeModel({ id: "missing/model" }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("Model not found");
    });
  });
});
