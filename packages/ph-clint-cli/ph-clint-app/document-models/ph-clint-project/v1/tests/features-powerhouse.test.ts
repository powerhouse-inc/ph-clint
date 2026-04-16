import { generateMock } from "document-model";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isPhClintProjectDocument,
  enablePowerhouse,
  setPowerhouseSwitchboard,
  setPowerhouseConnect,
  EnablePowerhouseInputSchema,
  SetPowerhouseSwitchboardInputSchema,
  SetPowerhouseConnectInputSchema,
} from "document-models/ph-clint-project/v1";

describe("FeaturesPowerhouseOperations", () => {
  it("should handle enablePowerhouse operation", () => {
    const document = utils.createDocument();
    const input = generateMock(EnablePowerhouseInputSchema());

    const updatedDocument = reducer(document, enablePowerhouse(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ENABLE_POWERHOUSE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setPowerhouseSwitchboard operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPowerhouseSwitchboardInputSchema());

    const updatedDocument = reducer(document, setPowerhouseSwitchboard(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_POWERHOUSE_SWITCHBOARD",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setPowerhouseConnect operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPowerhouseConnectInputSchema());

    const updatedDocument = reducer(document, setPowerhouseConnect(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_POWERHOUSE_CONNECT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
