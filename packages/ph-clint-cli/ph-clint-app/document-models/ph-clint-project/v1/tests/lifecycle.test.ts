import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  importSpec,
  isPhClintProjectDocument,
} from "document-models/ph-clint-project/v1";

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
});
