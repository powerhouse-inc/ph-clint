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
      // Derive the expected managed app package name
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
      state.features.mastra.agentId = action.input.agentId || null;
      state.features.mastra.agentName = action.input.agentName || null;
      state.features.mastra.models = (action.input.models || []).map((m) => ({
        id: m.id,
        isDefault: m.isDefault,
      }));
      state.features.mastra.profiles = (action.input.profiles || []).map(
        (p) => ({
          id: p.id,
          title: p.title,
          content: p.content,
        }),
      );
    },
  };
