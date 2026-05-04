import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isPhClintProjectDocument,
  setPowerhouseLevel,
  setPackageIdentifier,
} from "document-models/ph-clint-project/v1";

describe("FeaturesPowerhouseOperations", () => {
  it("should handle setPowerhouseLevel operation", () => {
    const document = utils.createDocument();
    const input = { level: "Reactor" as const };

    const updatedDocument = reducer(document, setPowerhouseLevel(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_POWERHOUSE_LEVEL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
    expect(updatedDocument.state.global.features.powerhouse).toBe("Reactor");
  });

  it("should allow raising from Disabled to Connect", () => {
    const document = utils.createDocument();

    const updatedDocument = reducer(
      document,
      setPowerhouseLevel({ level: "Connect" as const }),
    );

    expect(updatedDocument.state.global.features.powerhouse).toBe("Connect");
    expect(updatedDocument.operations.global[0].error).toBeUndefined();
  });

  it("should prevent lowering below Reactor once enabled", () => {
    const document = utils.createDocument();

    // First enable to Reactor
    const enabled = reducer(
      document,
      setPowerhouseLevel({ level: "Reactor" as const }),
    );

    // Try to go back to Disabled
    const lowered = reducer(
      enabled,
      setPowerhouseLevel({ level: "Disabled" as const }),
    );

    // Operation is recorded but has an error
    expect(lowered.operations.global).toHaveLength(2);
    expect(lowered.operations.global[1].error).toBe(
      "Cannot lower Powerhouse level below Reactor once enabled",
    );
    // State unchanged
    expect(lowered.state.global.features.powerhouse).toBe("Reactor");
  });

  it("should auto-enable proxyEnabled at Switchboard level", () => {
    const document = utils.createDocument();

    const updated = reducer(
      document,
      setPowerhouseLevel({ level: "Switchboard" as const }),
    );

    expect(updated.state.global.deployment.proxyEnabled).toBe(true);
  });

  it("should auto-enable proxyEnabled at Connect level", () => {
    const document = utils.createDocument();

    const updated = reducer(
      document,
      setPowerhouseLevel({ level: "Connect" as const }),
    );

    expect(updated.state.global.deployment.proxyEnabled).toBe(true);
  });

  it("should not auto-enable proxyEnabled at Reactor level", () => {
    const document = utils.createDocument();

    const updated = reducer(
      document,
      setPowerhouseLevel({ level: "Reactor" as const }),
    );

    expect(updated.state.global.deployment.proxyEnabled).toBe(false);
  });

  it("should skip auto-proxy when skipAutoProxy is true", () => {
    const document = utils.createDocument();

    const updated = reducer(
      document,
      setPowerhouseLevel({
        level: "Switchboard" as const,
        skipAutoProxy: true,
      }),
    );

    expect(updated.state.global.deployment.proxyEnabled).toBe(false);
  });

  it("should allow lowering from Connect to Reactor", () => {
    const document = utils.createDocument();

    const atConnect = reducer(
      document,
      setPowerhouseLevel({ level: "Connect" as const }),
    );
    const atReactor = reducer(
      atConnect,
      setPowerhouseLevel({ level: "Reactor" as const }),
    );

    expect(atReactor.state.global.features.powerhouse).toBe("Reactor");
    expect(atReactor.operations.global[1].error).toBeUndefined();
  });

  it("should auto-create managed app package with */* when enabling Powerhouse", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      setPackageIdentifier({ identifier: "@myorg/my-tool-cli" }),
    );
    const updated = reducer(
      doc,
      setPowerhouseLevel({ level: "Reactor" as const }),
    );

    const appPkg = updated.state.global.packages.find(
      (p) => p.packageName === "@myorg/my-tool-app",
    );
    expect(appPkg).toBeDefined();
    expect(appPkg!.managed).toBe(true);
    expect(appPkg!.version).toBeNull();
    expect(appPkg!.documentTypes).toEqual(["*/*"]);
  });

  it("should auto-create managed app package even when name is null", () => {
    const doc = utils.createDocument();
    const updated = reducer(
      doc,
      setPowerhouseLevel({ level: "Reactor" as const }),
    );

    expect(updated.state.global.packages).toHaveLength(1);
    const managed = updated.state.global.packages[0];
    expect(managed.managed).toBe(true);
    expect(managed.packageName).toBe("app");
    expect(managed.documentTypes).toEqual(["*/*"]);
  });

  it("should rename managed app package when identifier is set after enabling Powerhouse", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      setPowerhouseLevel({ level: "Reactor" as const }),
    );
    const updated = reducer(
      doc,
      setPackageIdentifier({ identifier: "@myorg/my-tool-cli" }),
    );

    const managed = updated.state.global.packages.find((p) => p.managed);
    expect(managed).toBeDefined();
    expect(managed!.packageName).toBe("@myorg/my-tool-app");
    expect(managed!.id).toBe("app-my-tool-cli");
  });
});
