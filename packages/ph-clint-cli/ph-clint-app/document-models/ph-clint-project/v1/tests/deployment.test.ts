import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  addSupportedResource,
  removeSupportedResource,
  setProxyEnabled,
  isPhClintProjectDocument,
} from "document-models/ph-clint-project/v1";

describe("DeploymentOperations", () => {
  describe("SET_PROXY_ENABLED", () => {
    it("should enable proxy", () => {
      const doc = utils.createDocument();
      const updated = reducer(doc, setProxyEnabled({ enabled: true }));

      expect(updated.state.global.deployment.proxyEnabled).toBe(true);
      expect(updated.operations.global[0].error).toBeUndefined();
    });

    it("should disable proxy", () => {
      let doc = utils.createDocument();
      doc = reducer(doc, setProxyEnabled({ enabled: true }));
      const updated = reducer(doc, setProxyEnabled({ enabled: false }));

      expect(updated.state.global.deployment.proxyEnabled).toBe(false);
    });
  });

  describe("ADD_SUPPORTED_RESOURCE", () => {
    it("should add a resource", () => {
      const doc = utils.createDocument();
      const updated = reducer(
        doc,
        addSupportedResource({ resource: "custom-resource" }),
      );

      expect(updated.state.global.deployment.supportedResources).toContain(
        "custom-resource",
      );
      expect(updated.operations.global[0].error).toBeUndefined();
    });

    it("should reject duplicate resource", () => {
      let doc = utils.createDocument();
      doc = reducer(doc, addSupportedResource({ resource: "my-resource" }));
      const updated = reducer(
        doc,
        addSupportedResource({ resource: "my-resource" }),
      );

      expect(updated.operations.global[1].error).toContain("already exists");
    });

    it("should reject duplicate from initial state", () => {
      const doc = utils.createDocument();
      const updated = reducer(
        doc,
        addSupportedResource({ resource: "vetra-agent-s" }),
      );

      expect(updated.operations.global[0].error).toContain("already exists");
    });
  });

  describe("REMOVE_SUPPORTED_RESOURCE", () => {
    it("should remove a resource", () => {
      const doc = utils.createDocument();
      const updated = reducer(
        doc,
        removeSupportedResource({ resource: "vetra-agent-s" }),
      );

      expect(updated.state.global.deployment.supportedResources).not.toContain(
        "vetra-agent-s",
      );
      expect(updated.operations.global[0].error).toBeUndefined();
    });

    it("should error on non-existent resource", () => {
      const doc = utils.createDocument();
      const updated = reducer(
        doc,
        removeSupportedResource({ resource: "nonexistent" }),
      );

      expect(updated.operations.global[0].error).toContain("not found");
    });
  });

  it("should dispatch addSupportedResource with correct action type", () => {
    const document = utils.createDocument();
    const input = { resource: "test-resource" };

    const updatedDocument = reducer(document, addSupportedResource(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SUPPORTED_RESOURCE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should dispatch removeSupportedResource with correct action type", () => {
    const document = utils.createDocument();
    const input = { resource: "vetra-agent-s" };

    const updatedDocument = reducer(document, removeSupportedResource(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_SUPPORTED_RESOURCE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should dispatch setProxyEnabled with correct action type", () => {
    const document = utils.createDocument();
    const input = { enabled: true };

    const updatedDocument = reducer(document, setProxyEnabled(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PROXY_ENABLED",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
