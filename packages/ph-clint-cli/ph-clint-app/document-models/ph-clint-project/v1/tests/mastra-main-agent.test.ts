import {
  clearMainAgentDescription,
  clearMainAgentImage,
  enableMastra,
  reducer,
  setMainAgentDescription,
  setMainAgentImage,
  setMainAgentName,
  utils,
  type PhClintProjectDocument,
} from "document-models/ph-clint-project/v1";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const PROMETHEUS_PNG = resolve(
  import.meta.dirname,
  "prometheus-zoomed-small.png",
);
const DATA_URL = `data:image/png;base64,${readFileSync(PROMETHEUS_PNG).toString("base64")}`;

function enabled(): PhClintProjectDocument {
  return reducer(
    utils.createDocument(),
    enableMastra({ agentId: "main", agentName: "Main" }),
  );
}

describe("MastraMainAgentOperations", () => {
  describe("SET_MAIN_AGENT_NAME", () => {
    it("trims and updates the name", () => {
      const doc = reducer(enabled(), setMainAgentName({ name: "  New Name  " }));
      expect(doc.state.global.features.mastra.mainAgent!.name).toBe("New Name");
    });

    it("rejects when the name is empty after trim", () => {
      const doc = reducer(enabled(), setMainAgentName({ name: "   " }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("must not be empty");
      expect(doc.state.global.features.mastra.mainAgent!.name).toBe("Main");
    });

    it("rejects when mastra is disabled", () => {
      const doc = reducer(
        utils.createDocument(),
        setMainAgentName({ name: "X" }),
      );
      expect(doc.operations.global[0].error).toContain("Mastra is disabled");
    });
  });

  describe("SET_MAIN_AGENT_DESCRIPTION", () => {
    it("sets the description", () => {
      const doc = reducer(
        enabled(),
        setMainAgentDescription({ description: "A helpful agent." }),
      );
      expect(doc.state.global.features.mastra.mainAgent!.description).toBe(
        "A helpful agent.",
      );
    });

    it("rejects when mastra is disabled", () => {
      const doc = reducer(
        utils.createDocument(),
        setMainAgentDescription({ description: "X" }),
      );
      expect(doc.operations.global[0].error).toContain("Mastra is disabled");
    });
  });

  describe("CLEAR_MAIN_AGENT_DESCRIPTION", () => {
    it("clears the description to null", () => {
      let doc = reducer(
        enabled(),
        setMainAgentDescription({ description: "desc" }),
      );
      doc = reducer(doc, clearMainAgentDescription({ _: true }));
      expect(doc.state.global.features.mastra.mainAgent!.description).toBeNull();
    });
  });

  describe("SET_MAIN_AGENT_IMAGE", () => {
    it("stores a data URL image", () => {
      const doc = reducer(enabled(), setMainAgentImage({ image: DATA_URL }));
      expect(doc.state.global.features.mastra.mainAgent!.image).toBe(DATA_URL);
    });

    it("rejects a non-data URL", () => {
      const doc = reducer(
        enabled(),
        setMainAgentImage({ image: "https://example.com/avatar.png" }),
      );
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("data URL");
      expect(doc.state.global.features.mastra.mainAgent!.image).toBeNull();
    });

    it("rejects when mastra is disabled", () => {
      const doc = reducer(
        utils.createDocument(),
        setMainAgentImage({ image: DATA_URL }),
      );
      expect(doc.operations.global[0].error).toContain("Mastra is disabled");
    });
  });

  describe("CLEAR_MAIN_AGENT_IMAGE", () => {
    it("clears the image to null", () => {
      let doc = reducer(enabled(), setMainAgentImage({ image: DATA_URL }));
      doc = reducer(doc, clearMainAgentImage({ _: true }));
      expect(doc.state.global.features.mastra.mainAgent!.image).toBeNull();
    });
  });
});
