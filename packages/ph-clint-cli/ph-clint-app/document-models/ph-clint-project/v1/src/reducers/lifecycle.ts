import type { PhClintProjectLifecycleOperations } from 'document-models/ph-clint-project/v1';
import { InvalidAgentImageError } from '../../gen/features-mastra/error.js';

export const phClintProjectLifecycleOperations: PhClintProjectLifecycleOperations = {
  importSpecOperation(state, action) {
    state.name = action.input.name;
    state.scope = action.input.scope || null;
    state.version = action.input.version;
    state.description = action.input.description;
    state.features.powerhouse = action.input.powerhouse;
    state.features.mastra.enabled = action.input.mastraEnabled;
    state.features.routine.enabled = action.input.routineEnabled;
    // Derive the expected managed app package name
    const appBase = action.input.name.replace(/-cli$/, '-app');
    const appPkgName = action.input.scope ? `${action.input.scope}/${appBase}` : appBase;
    const phEnabled = action.input.powerhouse !== 'Disabled';

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
    state.features.mastra.profiles = (action.input.profiles || []).map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
    }));

    // agentDescription — respects mastra-enabled guard
    if (action.input.agentDescription && state.features.mastra.enabled) {
      state.features.mastra.agentDescription = action.input.agentDescription;
    } else {
      state.features.mastra.agentDescription = null;
    }

    // agentImage — validates data URL format (same logic as setAgentImageOperation)
    if (action.input.agentImage && state.features.mastra.enabled) {
      if (!/^data:[a-z]+\/[a-z0-9.+-]+;base64,/.test(action.input.agentImage)) {
        throw new InvalidAgentImageError('Invalid image: must be a data URL (data:<mime>;base64,...)');
      }
      state.features.mastra.agentImage = action.input.agentImage;
    } else {
      state.features.mastra.agentImage = null;
    }

    // enableChat — respects mastra+powerhouse guards, manages clint-common package
    if (action.input.enableChat && state.features.mastra.enabled && state.features.powerhouse !== 'Disabled') {
      state.features.mastra.common.enableChat = true;
      const CLINT_COMMON_PKG = '@powerhousedao/clint-common';
      const CHAT_DOC_TYPE = 'powerhouse/chat-session';
      const existing = state.packages.find((p) => p.packageName === CLINT_COMMON_PKG);
      if (!existing) {
        state.packages.push({
          id: 'pkg-clint-common',
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

    // Deployment fields
    state.deployment.proxyEnabled = action.input.proxyEnabled ?? false;
    state.deployment.observabilityEnabled = action.input.observabilityEnabled ?? false;
    state.deployment.supportedResources = action.input.supportedResources ? [...action.input.supportedResources] : [];
  },
};
