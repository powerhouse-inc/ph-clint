import type { PhClintProjectLifecycleOperations } from "document-models/ph-clint-project/v1";

export const phClintProjectLifecycleOperations: PhClintProjectLifecycleOperations =
  {
    importSpecOperation(state, action) {
      state.name = action.input.name;
      state.scope = action.input.scope || null;
      state.version = action.input.version;
      state.description = action.input.description;
      state.features.powerhouse = action.input.powerhouse;
      state.features.mastra.enabled = action.input.mastraEnabled;
      state.features.routine.enabled = action.input.routineEnabled;

      const appBase = action.input.name.replace(/-cli$/, "-app");
      const appPkgName = action.input.scope
        ? `${action.input.scope}/${appBase}`
        : appBase;
      const phEnabled = action.input.powerhouse !== "Disabled";

      state.packages = action.input.packages.map((p) => ({
        id: p.id,
        packageName: p.packageName,
        documentTypes: [...p.documentTypes],
        version: p.version || null,
        managed: phEnabled && p.packageName === appPkgName,
      }));
      state.externalSkills = action.input.externalSkills.map((s) => ({
        id: s.id,
        name: s.name,
        githubUrl: s.githubUrl,
      }));

      state.features.mastra.models = action.input.models.map((m) => ({
        id: m.id,
      }));
      state.features.mastra.profiles = action.input.profiles.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
      }));

      if (action.input.mainAgent && state.features.mastra.enabled) {
        const m = action.input.mainAgent;
        state.features.mastra.mainAgent = {
          id: m.id,
          name: m.name,
          description: m.description || null,
          attachment: m.attachment || null,
          modelId: m.modelId,
          profileIds: [...m.profileIds],
          skills: [...m.skills],
          toolPatterns: [...m.toolPatterns],
        };
      } else {
        state.features.mastra.mainAgent = null;
      }

      if (state.features.mastra.enabled) {
        state.features.mastra.subAgents = action.input.subAgents.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          modelId: s.modelId,
          profileIds: [...s.profileIds],
          skills: [...s.skills],
          toolPatterns: [...s.toolPatterns],
        }));
      } else {
        state.features.mastra.subAgents = [];
      }

      if (
        action.input.enableChat &&
        state.features.mastra.enabled &&
        state.features.powerhouse !== "Disabled"
      ) {
        state.features.mastra.common.enableChat = true;
        const CLINT_COMMON_PKG = "@powerhousedao/clint-common";
        const CHAT_DOC_TYPE = "powerhouse/chat-session";
        const existing = state.packages.find(
          (p) => p.packageName === CLINT_COMMON_PKG,
        );
        if (!existing) {
          state.packages.push({
            id: "pkg-clint-common",
            packageName: CLINT_COMMON_PKG,
            documentTypes: [CHAT_DOC_TYPE],
            version: null,
            managed: true,
          });
        } else if (!existing.documentTypes.includes(CHAT_DOC_TYPE)) {
          existing.documentTypes.push(CHAT_DOC_TYPE);
        }
      } else {
        state.features.mastra.common.enableChat = false;
      }

      state.deployment.proxyEnabled = action.input.proxyEnabled ?? false;
      state.deployment.observabilityEnabled =
        action.input.observabilityEnabled ?? false;
      state.deployment.supportedResources = action.input.supportedResources
        ? [...action.input.supportedResources]
        : [];
    },
  };
