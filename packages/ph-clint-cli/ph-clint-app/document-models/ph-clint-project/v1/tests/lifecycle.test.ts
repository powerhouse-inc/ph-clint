import { generateMock } from "document-model";
import {
  importSpec,
  ImportSpecInputSchema,
  isPhClintProjectDocument,
  reducer,
  utils,
  type ImportSpecInput,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

const ATTACHMENT_REF = "attachment://v1:abc123deadbeef";

function baseInput(): ImportSpecInput {
  return {
    name: "my-project",
    scope: "myorg",
    version: "1.2.3",
    description: "A test project",
    powerhouse: "Reactor",
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
    models: [
      { id: "anthropic/claude-sonnet-4-5" },
      { id: "openai/gpt-4o" },
    ],
    profiles: [
      { id: "base", title: "Base", content: "Base instructions." },
      { id: "tools", title: "Tools", content: "Tool usage." },
    ],
    mainAgent: {
      id: "my-agent",
      name: "My Agent",
      description: null,
      attachment: null,
      modelId: "anthropic/claude-sonnet-4-5",
      profileIds: ["base"],
      skills: [],
      toolPatterns: [],
    },
    subAgents: [],
  };
}

describe("LifecycleOperations.importSpec", () => {
  it("imports top-level fields, packages, external skills, and library", () => {
    const doc = reducer(utils.createDocument(), importSpec(baseInput()));
    const state = doc.state.global;

    expect(doc.operations.global[0].error).toBeUndefined();
    expect(state.name).toBe("my-project");
    expect(state.scope).toBe("myorg");
    expect(state.version).toBe("1.2.3");
    expect(state.description).toBe("A test project");
    expect(state.features.powerhouse).toBe("Reactor");
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
    expect(state.features.mastra.models).toHaveLength(2);
    expect(state.features.mastra.profiles).toHaveLength(2);
  });

  it("marks the app package as managed when its name matches `{scope}/{name-cli→name-app}`", () => {
    const input = baseInput();
    input.name = "my-tool-cli";
    input.scope = "@myorg";
    input.packages = [
      {
        id: "app-pkg",
        packageName: "@myorg/my-tool-app",
        documentTypes: [],
      },
      {
        id: "other-pkg",
        packageName: "some/other",
        documentTypes: [],
      },
    ];
    const doc = reducer(utils.createDocument(), importSpec(input));
    const pkgs = doc.state.global.packages;
    expect(pkgs.find((p) => p.id === "app-pkg")!.managed).toBe(true);
    expect(pkgs.find((p) => p.id === "other-pkg")!.managed).toBe(false);
  });

  it("hydrates mainAgent when mastraEnabled is true", () => {
    const doc = reducer(utils.createDocument(), importSpec(baseInput()));
    const main = doc.state.global.features.mastra.mainAgent!;
    expect(main.id).toBe("my-agent");
    expect(main.modelId).toBe("anthropic/claude-sonnet-4-5");
    expect(main.profileIds).toEqual(["base"]);
  });

  it("stores main agent attachment ref", () => {
    const input = baseInput();
    input.mainAgent = { ...input.mainAgent!, attachment: ATTACHMENT_REF };
    const doc = reducer(utils.createDocument(), importSpec(input));
    expect(doc.operations.global[0].error).toBeUndefined();
    expect(doc.state.global.features.mastra.mainAgent!.attachment).toBe(
      ATTACHMENT_REF,
    );
  });

  it("imports sub-agents", () => {
    const input = baseInput();
    input.subAgents = [
      {
        id: "summarizer",
        name: "Summarizer",
        description: "Summarizes content.",
        modelId: "openai/gpt-4o",
        profileIds: ["tools"],
        skills: ["playwright-cli"],
        toolPatterns: ["cli-docs"],
      },
    ];
    const doc = reducer(utils.createDocument(), importSpec(input));
    const subs = doc.state.global.features.mastra.subAgents;
    expect(subs).toHaveLength(1);
    expect(subs[0]).toEqual({
      id: "summarizer",
      name: "Summarizer",
      description: "Summarizes content.",
      modelId: "openai/gpt-4o",
      profileIds: ["tools"],
      skills: ["playwright-cli"],
      toolPatterns: ["cli-docs"],
    });
  });

  it("forces mainAgent to null and subAgents to [] when mastraEnabled is false", () => {
    const input = baseInput();
    input.mastraEnabled = false;
    input.subAgents = [
      {
        id: "summarizer",
        name: "S",
        description: "x",
        modelId: "openai/gpt-4o",
        profileIds: [],
        skills: [],
        toolPatterns: [],
      },
    ];
    const doc = reducer(utils.createDocument(), importSpec(input));
    expect(doc.state.global.features.mastra.mainAgent).toBeNull();
    expect(doc.state.global.features.mastra.subAgents).toEqual([]);
  });

  it("enables chat and auto-adds clint-common when enableChat + mastra + powerhouse all on", () => {
    const input = baseInput();
    input.enableChat = true;
    const doc = reducer(utils.createDocument(), importSpec(input));
    const pkg = doc.state.global.packages.find(
      (p) => p.packageName === "@powerhousedao/clint-common",
    );
    expect(pkg).toBeDefined();
    expect(pkg!.documentTypes).toEqual(["powerhouse/chat-session"]);
    expect(doc.state.global.features.mastra.common.enableChat).toBe(true);
  });

  it("does not enable chat when powerhouse is Disabled", () => {
    const input = baseInput();
    input.enableChat = true;
    input.powerhouse = "Disabled";
    const doc = reducer(utils.createDocument(), importSpec(input));
    expect(doc.state.global.features.mastra.common.enableChat).toBe(false);
    expect(
      doc.state.global.packages.find(
        (p) => p.packageName === "@powerhousedao/clint-common",
      ),
    ).toBeUndefined();
  });

  it("imports deployment fields", () => {
    const input = baseInput();
    input.proxyEnabled = true;
    input.observabilityEnabled = true;
    input.supportedResources = ["vetra-agent-s", "vetra-agent-m"];
    const doc = reducer(utils.createDocument(), importSpec(input));
    expect(doc.state.global.deployment.proxyEnabled).toBe(true);
    expect(doc.state.global.deployment.observabilityEnabled).toBe(true);
    expect(doc.state.global.deployment.supportedResources).toEqual([
      "vetra-agent-s",
      "vetra-agent-m",
    ]);
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
