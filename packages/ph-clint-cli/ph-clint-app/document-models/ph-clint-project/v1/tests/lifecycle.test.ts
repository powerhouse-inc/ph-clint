import { generateMock } from "@powerhousedao/codegen";
import {
  importSpec,
  ImportSpecInputSchema,
  isPhClintProjectDocument,
  reducer,
  utils,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

describe("LifecycleOperations", () => {
  const baseInput = {
    name: "my-project",
    scope: "myorg",
    version: "1.2.3",
    description: "A test project",
    powerhouse: "Reactor" as const,
    mastraEnabled: true,
    routineEnabled: true,
    packages: [
      {
        id: "pkg-1",
        packageName: "my-project-app",
        documentTypes: ["org/doc-a"],
      },
    ],
    externalSkills: [
      {
        id: "sk-1",
        name: "playwright-cli",
        githubUrl: "https://github.com/example/playwright-cli",
      },
    ],
    agentId: "my-agent",
    agentName: "My Agent",
    models: [
      { id: "anthropic/claude-sonnet-4-5", isDefault: true },
      { id: "openai/gpt-4o", isDefault: false },
    ],
    profiles: [
      { id: "base", title: "Base", content: "Base instructions." },
      { id: "tools", title: "Tools", content: "Tool usage." },
    ],
  };

  it("should import all fields", () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, importSpec(baseInput));
    const state = updated.state.global;

    expect(updated.operations.global[0].error).toBeUndefined();
    expect(state.name).toBe("my-project");
    expect(state.scope).toBe("myorg");
    expect(state.version).toBe("1.2.3");
    expect(state.description).toBe("A test project");
    expect(state.features.powerhouse).toBe("Reactor");
    expect(state.features.mastra.enabled).toBe(true);
    expect(state.features.routine.enabled).toBe(true);
    expect(state.packages).toEqual([
      {
        id: "pkg-1",
        packageName: "my-project-app",
        documentTypes: ["org/doc-a"],
        version: null,
        managed: false,
      },
    ]);
    expect(state.externalSkills).toEqual([
      {
        id: "sk-1",
        name: "playwright-cli",
        githubUrl: "https://github.com/example/playwright-cli",
      },
    ]);
    expect(state.features.mastra.agentId).toBe("my-agent");
    expect(state.features.mastra.agentName).toBe("My Agent");
    expect(state.features.mastra.models).toEqual([
      { id: "anthropic/claude-sonnet-4-5", isDefault: true },
      { id: "openai/gpt-4o", isDefault: false },
    ]);
    expect(state.features.mastra.profiles).toEqual([
      { id: "base", title: "Base", content: "Base instructions." },
      { id: "tools", title: "Tools", content: "Tool usage." },
    ]);
  });

  it("should default nullable fields to null", () => {
    const doc = utils.createDocument();
    const updated = reducer(
      doc,
      importSpec({
        ...baseInput,
        scope: null,
        agentId: null,
        agentName: null,
        models: null,
        profiles: null,
      }),
    );
    const state = updated.state.global;

    expect(state.scope).toBeNull();
    expect(state.features.mastra.agentId).toBeNull();
    expect(state.features.mastra.agentName).toBeNull();
    expect(state.features.mastra.models).toEqual([]);
    expect(state.features.mastra.profiles).toEqual([]);
  });

  it("should default omitted mastra fields", () => {
    const doc = utils.createDocument();
    const {
      agentId: _a,
      agentName: _b,
      models: _c,
      profiles: _d,
      ...minimalInput
    } = baseInput;
    const updated = reducer(doc, importSpec(minimalInput));
    const state = updated.state.global;

    expect(state.features.mastra.agentId).toBeNull();
    expect(state.features.mastra.agentName).toBeNull();
    expect(state.features.mastra.models).toEqual([]);
    expect(state.features.mastra.profiles).toEqual([]);
  });

  it("should overwrite previous state completely", () => {
    const doc = utils.createDocument();
    const first = reducer(doc, importSpec(baseInput));
    const second = reducer(
      first,
      importSpec({
        ...baseInput,
        name: "other-project",
        agentId: "other-agent",
        agentName: "Other Agent",
        models: [{ id: "openai/gpt-4o", isDefault: true }],
        profiles: [],
        externalSkills: [],
        packages: [],
      }),
    );
    const state = second.state.global;

    expect(state.name).toBe("other-project");
    expect(state.features.mastra.agentId).toBe("other-agent");
    expect(state.features.mastra.models).toEqual([
      { id: "openai/gpt-4o", isDefault: true },
    ]);
    expect(state.features.mastra.profiles).toEqual([]);
    expect(state.externalSkills).toEqual([]);
    expect(state.packages).toEqual([]);
  });

  it("should dispatch importSpec with correct action type", () => {
    const document = utils.createDocument();
    const input = { ...baseInput };

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should import agentDescription and agentImage", () => {
    const doc = utils.createDocument();
    const updated = reducer(
      doc,
      importSpec({
        ...baseInput,
        agentDescription: "A helpful coding assistant",
        agentImage: "data:image/png;base64,iVBORw0KGgo=",
      }),
    );
    const state = updated.state.global;

    expect(updated.operations.global[0].error).toBeUndefined();
    expect(state.features.mastra.agentDescription).toBe(
      "A helpful coding assistant",
    );
    expect(state.features.mastra.agentImage).toBe(
      "data:image/png;base64,iVBORw0KGgo=",
    );
  });

  it("should import enableChat and add clint-common package", () => {
    const doc = utils.createDocument();
    const updated = reducer(
      doc,
      importSpec({
        ...baseInput,
        enableChat: true,
      }),
    );
    const state = updated.state.global;

    expect(updated.operations.global[0].error).toBeUndefined();
    expect(state.features.mastra.common.enableChat).toBe(true);
    const ccPkg = state.packages.find(
      (p) => p.packageName === "@powerhousedao/clint-common",
    );
    expect(ccPkg).toBeDefined();
    expect(ccPkg!.documentTypes).toContain("powerhouse/chat-session");
    expect(ccPkg!.managed).toBe(true);
  });

  it("should not duplicate clint-common when already in packages", () => {
    const doc = utils.createDocument();
    const updated = reducer(
      doc,
      importSpec({
        ...baseInput,
        packages: [
          ...baseInput.packages,
          {
            id: "pkg-clint-common",
            packageName: "@powerhousedao/clint-common",
            documentTypes: ["powerhouse/chat-session"],
          },
        ],
        enableChat: true,
      }),
    );
    const state = updated.state.global;

    expect(updated.operations.global[0].error).toBeUndefined();
    const ccPkgs = state.packages.filter(
      (p) => p.packageName === "@powerhousedao/clint-common",
    );
    expect(ccPkgs).toHaveLength(1);
  });

  it("should import deployment fields (proxyEnabled, supportedResources)", () => {
    const doc = utils.createDocument();
    const updated = reducer(
      doc,
      importSpec({
        ...baseInput,
        proxyEnabled: true,
        supportedResources: ["vetra-agent-s", "vetra-agent-m"],
      }),
    );
    const state = updated.state.global;

    expect(updated.operations.global[0].error).toBeUndefined();
    expect(state.deployment.proxyEnabled).toBe(true);
    expect(state.deployment.supportedResources).toEqual([
      "vetra-agent-s",
      "vetra-agent-m",
    ]);
  });

  it("should validate agentImage as data URL on import", () => {
    const doc = utils.createDocument();
    const updated = reducer(
      doc,
      importSpec({
        ...baseInput,
        agentImage: "https://example.com/avatar.png",
      }),
    );

    expect(updated.operations.global[0].error).toBe(
      "Invalid image: must be a data URL (data:<mime>;base64,...)",
    );
    expect(updated.state.global.features.mastra.agentImage).toBeNull();
  });

  it("should default new optional fields to null/false when omitted", () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, importSpec(baseInput));
    const state = updated.state.global;

    expect(state.features.mastra.agentDescription).toBeNull();
    expect(state.features.mastra.agentImage).toBeNull();
    expect(state.features.mastra.common.enableChat).toBe(false);
    expect(state.deployment.proxyEnabled).toBe(false);
    expect(state.deployment.supportedResources).toEqual([]);
  });

  it("should overwrite deployment on re-import", () => {
    const doc = utils.createDocument();
    const first = reducer(
      doc,
      importSpec({
        ...baseInput,
        proxyEnabled: true,
        supportedResources: ["vetra-agent-s", "vetra-agent-m"],
      }),
    );
    const second = reducer(
      first,
      importSpec({
        ...baseInput,
        proxyEnabled: false,
        supportedResources: ["vetra-agent-xl"],
      }),
    );
    const state = second.state.global;

    expect(state.deployment.proxyEnabled).toBe(false);
    expect(state.deployment.supportedResources).toEqual(["vetra-agent-xl"]);
  });

  it("should skip enableChat when mastra is disabled", () => {
    const doc = utils.createDocument();
    const updated = reducer(
      doc,
      importSpec({
        ...baseInput,
        mastraEnabled: false,
        enableChat: true,
      }),
    );
    const state = updated.state.global;

    expect(state.features.mastra.common.enableChat).toBe(false);
  });

  it("should skip enableChat when powerhouse is Disabled", () => {
    const doc = utils.createDocument();
    const updated = reducer(
      doc,
      importSpec({
        ...baseInput,
        powerhouse: "Disabled" as const,
        enableChat: true,
      }),
    );
    const state = updated.state.global;

    expect(state.features.mastra.common.enableChat).toBe(false);
  });

  it("should skip agentDescription when mastra is disabled", () => {
    const doc = utils.createDocument();
    const updated = reducer(
      doc,
      importSpec({
        ...baseInput,
        mastraEnabled: false,
        agentDescription: "Should be ignored",
      }),
    );
    const state = updated.state.global;

    expect(state.features.mastra.agentDescription).toBeNull();
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
