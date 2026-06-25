import { generateMock } from "document-model";
import {
  addSupportedResource,
  AddSupportedResourceInputSchema,
  isPhClintProjectDocument,
  reducer,
  removeSupportedResource,
  RemoveSupportedResourceInputSchema,
  setObservabilityEnabled,
  SetObservabilityEnabledInputSchema,
  setProxyEnabled,
  SetProxyEnabledInputSchema,
  utils,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

describe("DeploymentOperations", () => {
  it("should handle addSupportedResource operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSupportedResourceInputSchema());

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

  it("should handle removeSupportedResource operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveSupportedResourceInputSchema());

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

  it("should handle setProxyEnabled operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetProxyEnabledInputSchema());

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

  it("should handle setObservabilityEnabled operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetObservabilityEnabledInputSchema());

    const updatedDocument = reducer(document, setObservabilityEnabled(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_OBSERVABILITY_ENABLED",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
