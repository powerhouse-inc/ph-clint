import {
  addModel,
  addSubAgent,
  enableMastra,
  reducer,
  removeModel,
  setAgentModel,
  setDefaultModel,
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
    it("adds a provider/name model and respects isDefault flag", () => {
      let doc = enabled();
      doc = reducer(doc, addModel({ id: "anthropic/claude-sonnet-4-5" }));
      const models = doc.state.global.features.mastra.models;
      expect(models).toContainEqual({
        id: "anthropic/claude-sonnet-4-5",
        isDefault: false,
      });

      doc = reducer(
        doc,
        addModel({ id: "openai/gpt-4o", isDefault: true }),
      );
      const next = doc.state.global.features.mastra.models;
      expect(next.find((m) => m.id === "clint/demo-agent")!.isDefault).toBe(false);
      expect(next.find((m) => m.id === "openai/gpt-4o")!.isDefault).toBe(true);
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

    it("removes an unused model and promotes another to default", () => {
      let doc = enabled();
      doc = reducer(doc, addModel({ id: "openai/gpt-4o" }));
      doc = reducer(
        doc,
        setAgentModel({ agentId: "main", modelId: "openai/gpt-4o" }),
      );
      doc = reducer(doc, removeModel({ id: "clint/demo-agent" }));
      const models = doc.state.global.features.mastra.models;
      expect(models.find((m) => m.id === "clint/demo-agent")).toBeUndefined();
      expect(models.find((m) => m.id === "openai/gpt-4o")!.isDefault).toBe(true);
    });

    it("rejects when model id is not found", () => {
      const doc = reducer(enabled(), removeModel({ id: "missing/model" }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("Model not found");
    });
  });

  describe("SET_DEFAULT_MODEL", () => {
    it("flips the default to the named model", () => {
      let doc = enabled();
      doc = reducer(doc, addModel({ id: "openai/gpt-4o" }));
      doc = reducer(doc, setDefaultModel({ id: "openai/gpt-4o" }));
      const models = doc.state.global.features.mastra.models;
      expect(models.find((m) => m.id === "openai/gpt-4o")!.isDefault).toBe(true);
      expect(models.find((m) => m.id === "clint/demo-agent")!.isDefault).toBe(false);
    });

    it("rejects when model is not in the library", () => {
      const doc = reducer(enabled(), setDefaultModel({ id: "missing/x" }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("Model not found");
    });
  });
});
