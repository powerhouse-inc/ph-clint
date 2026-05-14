import {
  addPowerhousePackage,
  disableMastra,
  enableMastra,
  reducer,
  setEnableChat,
  setPowerhouseLevel,
  utils,
  type PhClintProjectDocument,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

/** Helper: enabled doc with mastra on. */
function enabled(): PhClintProjectDocument {
  return reducer(
    utils.createDocument(),
    enableMastra({ agentId: "test-agent", agentName: "Test Agent" }),
  );
}

/** Helper: enabled doc with powerhouse at Reactor (required for SET_ENABLE_CHAT). */
function enabledWithPowerhouse(): PhClintProjectDocument {
  let doc = enabled();
  doc = reducer(doc, setPowerhouseLevel({ level: "Reactor", skipAutoProxy: true }));
  return doc;
}

describe("FeaturesMastraOperations", () => {
  describe("ENABLE_MASTRA", () => {
    it("seeds mainAgent + default model + base profile", () => {
      const doc = enabled();
      const s = doc.state.global.features.mastra;
      expect(doc.operations.global[0].error).toBeUndefined();
      expect(s.enabled).toBe(true);
      expect(s.mainAgent).not.toBeNull();
      expect(s.mainAgent!.id).toBe("test-agent");
      expect(s.mainAgent!.name).toBe("Test Agent");
      expect(s.mainAgent!.modelId).toBe("clint/demo-agent");
      expect(s.mainAgent!.profileIds).toEqual(["base"]);
      expect(s.mainAgent!.skills).toEqual([]);
      expect(s.mainAgent!.toolPatterns).toEqual([]);
      expect(s.models).toEqual([{ id: "clint/demo-agent", isDefault: true }]);
      expect(s.profiles).toEqual([
        { id: "base", title: "Base Profile", content: "You are a helpful assistant." },
      ]);
    });

    it("trims agentName", () => {
      const doc = reducer(
        utils.createDocument(),
        enableMastra({ agentId: "my-agent", agentName: "  My Agent  " }),
      );
      expect(doc.state.global.features.mastra.mainAgent!.name).toBe("My Agent");
    });

    it("rejects invalid agentId regex", () => {
      const doc = reducer(
        utils.createDocument(),
        enableMastra({ agentId: "Bad-ID", agentName: "X" }),
      );
      expect(doc.operations.global[0].error).toContain("Invalid agent ID");
      expect(doc.state.global.features.mastra.enabled).toBe(false);
      expect(doc.state.global.features.mastra.mainAgent).toBeNull();
    });

    it("rejects empty agentName", () => {
      const doc = reducer(
        utils.createDocument(),
        enableMastra({ agentId: "my-agent", agentName: "   " }),
      );
      expect(doc.operations.global[0].error).toContain("must not be empty");
      expect(doc.state.global.features.mastra.enabled).toBe(false);
    });

    it("when re-enabled, replaces id and name but preserves the existing mainAgent's bindings", () => {
      let doc = enabled();
      // Re-enable with a new agentId+name
      doc = reducer(doc, enableMastra({ agentId: "renamed", agentName: "Renamed" }));
      const main = doc.state.global.features.mastra.mainAgent!;
      expect(main.id).toBe("renamed");
      expect(main.name).toBe("Renamed");
      // Bindings preserved
      expect(main.modelId).toBe("clint/demo-agent");
      expect(main.profileIds).toEqual(["base"]);
    });
  });

  describe("DISABLE_MASTRA", () => {
    it("clears mainAgent, subAgents, models, profiles, and chat", () => {
      const doc = reducer(enabled(), disableMastra({ _: true }));
      const s = doc.state.global.features.mastra;
      expect(s.enabled).toBe(false);
      expect(s.mainAgent).toBeNull();
      expect(s.subAgents).toEqual([]);
      expect(s.models).toEqual([]);
      expect(s.profiles).toEqual([]);
      expect(s.common.enableChat).toBe(false);
    });

    it("removes managed clint-common package when disabled", () => {
      let doc = enabledWithPowerhouse();
      doc = reducer(doc, setEnableChat({ enabled: true }));
      // clint-common added
      expect(
        doc.state.global.packages.some(
          (p) => p.packageName === "@powerhousedao/clint-common" && p.managed,
        ),
      ).toBe(true);

      doc = reducer(doc, disableMastra({ _: true }));
      expect(
        doc.state.global.packages.some(
          (p) => p.packageName === "@powerhousedao/clint-common",
        ),
      ).toBe(false);
    });
  });

  describe("SET_ENABLE_CHAT", () => {
    it("rejects when mastra is disabled", () => {
      const doc = reducer(utils.createDocument(), setEnableChat({ enabled: true }));
      expect(doc.operations.global[0].error).toContain("Cannot toggle chat");
    });

    it("rejects when powerhouse is Disabled", () => {
      const doc = reducer(enabled(), setEnableChat({ enabled: true }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("Powerhouse");
      expect(doc.state.global.features.mastra.common.enableChat).toBe(false);
    });

    it("adds the managed clint-common package on enable", () => {
      let doc = enabledWithPowerhouse();
      doc = reducer(doc, setEnableChat({ enabled: true }));
      const pkg = doc.state.global.packages.find(
        (p) => p.packageName === "@powerhousedao/clint-common",
      );
      expect(pkg).toBeDefined();
      expect(pkg!.managed).toBe(true);
      expect(pkg!.documentTypes).toEqual(["powerhouse/chat-session"]);
      expect(doc.state.global.features.mastra.common.enableChat).toBe(true);
    });

    it("appends chat-session doc type to a pre-existing clint-common package", () => {
      let doc = enabledWithPowerhouse();
      doc = reducer(
        doc,
        addPowerhousePackage({
          id: "pkg-clint-common-manual",
          packageName: "@powerhousedao/clint-common",
        }),
      );
      doc = reducer(doc, setEnableChat({ enabled: true }));
      const pkg = doc.state.global.packages.find(
        (p) => p.packageName === "@powerhousedao/clint-common",
      )!;
      expect(pkg.documentTypes).toContain("powerhouse/chat-session");
    });

    it("removes the managed clint-common package on disable when it has only chat-session", () => {
      let doc = enabledWithPowerhouse();
      doc = reducer(doc, setEnableChat({ enabled: true }));
      doc = reducer(doc, setEnableChat({ enabled: false }));
      expect(
        doc.state.global.packages.find(
          (p) => p.packageName === "@powerhousedao/clint-common",
        ),
      ).toBeUndefined();
      expect(doc.state.global.features.mastra.common.enableChat).toBe(false);
    });
  });
});
