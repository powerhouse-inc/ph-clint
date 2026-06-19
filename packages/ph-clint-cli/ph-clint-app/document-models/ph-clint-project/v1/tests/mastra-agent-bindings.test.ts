import {
  addAgentProfileRef,
  addAgentSkill,
  addAgentToolPattern,
  addModel,
  addProfile,
  addSubAgent,
  enableMastra,
  reducer,
  removeAgentProfileRef,
  removeAgentSkill,
  removeAgentToolPattern,
  reorderAgentProfileRefs,
  setAgentModel,
  utils,
  type PhClintProjectDocument,
} from 'document-models/ph-clint-project/v1';
import { describe, expect, it } from 'vitest';

function setup(): PhClintProjectDocument {
  let doc = reducer(utils.createDocument(), enableMastra({ agentId: 'main', agentName: 'Main' }));
  doc = reducer(doc, addModel({ id: 'openai/gpt-4o' }));
  doc = reducer(doc, addModel({ id: 'anthropic/claude-haiku-4-5' }));
  doc = reducer(doc, addProfile({ id: 'tools', title: 'Tools', content: '' }));
  doc = reducer(doc, addProfile({ id: 'style', title: 'Style', content: '' }));
  doc = reducer(
    doc,
    addSubAgent({
      id: 'sub',
      name: 'Sub',
      description: 'A sub.',
      modelId: 'openai/gpt-4o',
    }),
  );
  return doc;
}

describe('MastraAgentBindingsOperations', () => {
  describe('SET_AGENT_MODEL', () => {
    it("retargets the main agent's model", () => {
      let doc = setup();
      doc = reducer(doc, setAgentModel({ agentId: 'main', modelId: 'anthropic/claude-haiku-4-5' }));
      expect(doc.state.global.features.mastra.mainAgent!.modelId).toBe('anthropic/claude-haiku-4-5');
    });

    it("retargets a sub-agent's model", () => {
      let doc = setup();
      doc = reducer(doc, setAgentModel({ agentId: 'sub', modelId: 'anthropic/claude-haiku-4-5' }));
      expect(doc.state.global.features.mastra.subAgents[0].modelId).toBe('anthropic/claude-haiku-4-5');
    });

    it('rejects an unknown agentId', () => {
      const doc = reducer(setup(), setAgentModel({ agentId: 'missing', modelId: 'openai/gpt-4o' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('Agent not found');
    });

    it('rejects an unknown modelId', () => {
      const doc = reducer(setup(), setAgentModel({ agentId: 'main', modelId: 'missing/model' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('Model not in library');
    });
  });

  describe('ADD_AGENT_PROFILE_REF', () => {
    it('appends a profile ref when insertBefore is omitted', () => {
      let doc = setup();
      doc = reducer(doc, addAgentProfileRef({ agentId: 'main', profileId: 'tools' }));
      expect(doc.state.global.features.mastra.mainAgent!.profileIds).toEqual(['base', 'tools']);
    });

    it('inserts before the named ref when insertBefore is provided', () => {
      let doc = setup();
      doc = reducer(doc, addAgentProfileRef({ agentId: 'main', profileId: 'tools' }));
      doc = reducer(
        doc,
        addAgentProfileRef({
          agentId: 'main',
          profileId: 'style',
          insertBefore: 'tools',
        }),
      );
      expect(doc.state.global.features.mastra.mainAgent!.profileIds).toEqual(['base', 'style', 'tools']);
    });

    it('dedupes silently when the profile is already attached', () => {
      let doc = setup();
      doc = reducer(doc, addAgentProfileRef({ agentId: 'main', profileId: 'base' }));
      expect(doc.state.global.features.mastra.mainAgent!.profileIds).toEqual(['base']);
    });

    it('rejects when profile is not in the library', () => {
      const doc = reducer(setup(), addAgentProfileRef({ agentId: 'main', profileId: 'missing' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('not in library');
    });

    it('works for sub-agents too', () => {
      let doc = setup();
      doc = reducer(doc, addAgentProfileRef({ agentId: 'sub', profileId: 'tools' }));
      expect(doc.state.global.features.mastra.subAgents[0].profileIds).toEqual(['tools']);
    });
  });

  describe('REMOVE_AGENT_PROFILE_REF', () => {
    it('removes a profile ref', () => {
      let doc = setup();
      doc = reducer(doc, addAgentProfileRef({ agentId: 'main', profileId: 'tools' }));
      doc = reducer(doc, removeAgentProfileRef({ agentId: 'main', profileId: 'base' }));
      expect(doc.state.global.features.mastra.mainAgent!.profileIds).toEqual(['tools']);
    });

    it('rejects when the profile ref is not on the agent', () => {
      const doc = reducer(setup(), removeAgentProfileRef({ agentId: 'main', profileId: 'tools' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('not in agent');
    });
  });

  describe('REORDER_AGENT_PROFILE_REFS', () => {
    it('moves listed refs before insertBefore', () => {
      let doc = setup();
      doc = reducer(doc, addAgentProfileRef({ agentId: 'main', profileId: 'tools' }));
      doc = reducer(doc, addAgentProfileRef({ agentId: 'main', profileId: 'style' }));
      doc = reducer(
        doc,
        reorderAgentProfileRefs({
          agentId: 'main',
          ids: ['style'],
          insertBefore: 'tools',
        }),
      );
      expect(doc.state.global.features.mastra.mainAgent!.profileIds).toEqual(['base', 'style', 'tools']);
    });

    it('appends moved refs when insertBefore is null', () => {
      let doc = setup();
      doc = reducer(doc, addAgentProfileRef({ agentId: 'main', profileId: 'tools' }));
      doc = reducer(doc, addAgentProfileRef({ agentId: 'main', profileId: 'style' }));
      doc = reducer(
        doc,
        reorderAgentProfileRefs({
          agentId: 'main',
          ids: ['base'],
          insertBefore: null,
        }),
      );
      expect(doc.state.global.features.mastra.mainAgent!.profileIds).toEqual(['tools', 'style', 'base']);
    });

    it('rejects when any id is not on the agent', () => {
      const doc = reducer(
        setup(),
        reorderAgentProfileRefs({
          agentId: 'main',
          ids: ['tools'],
          insertBefore: null,
        }),
      );
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('not in agent');
    });
  });

  describe('ADD_AGENT_SKILL', () => {
    it('adds a kebab-case skill', () => {
      const doc = reducer(setup(), addAgentSkill({ agentId: 'main', name: 'playwright-cli' }));
      expect(doc.state.global.features.mastra.mainAgent!.skills).toEqual(['playwright-cli']);
    });

    it('dedupes silently', () => {
      let doc = setup();
      doc = reducer(doc, addAgentSkill({ agentId: 'main', name: 'playwright-cli' }));
      doc = reducer(doc, addAgentSkill({ agentId: 'main', name: 'playwright-cli' }));
      expect(doc.state.global.features.mastra.mainAgent!.skills).toEqual(['playwright-cli']);
    });

    it('rejects invalid format', () => {
      const doc = reducer(setup(), addAgentSkill({ agentId: 'main', name: 'Bad-Skill' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('lowercase kebab-case');
    });
  });

  describe('REMOVE_AGENT_SKILL', () => {
    it('removes a skill from an agent', () => {
      let doc = setup();
      doc = reducer(doc, addAgentSkill({ agentId: 'sub', name: 'playwright-cli' }));
      doc = reducer(doc, removeAgentSkill({ agentId: 'sub', name: 'playwright-cli' }));
      expect(doc.state.global.features.mastra.subAgents[0].skills).toEqual([]);
    });

    it('rejects when the skill is not on the agent', () => {
      const doc = reducer(setup(), removeAgentSkill({ agentId: 'main', name: 'missing' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('not on agent');
    });
  });

  describe('ADD_AGENT_TOOL_PATTERN', () => {
    it('adds a glob pattern', () => {
      const doc = reducer(setup(), addAgentToolPattern({ agentId: 'sub', pattern: 'clint-project-*' }));
      expect(doc.state.global.features.mastra.subAgents[0].toolPatterns).toEqual(['clint-project-*']);
    });

    it('rejects an empty pattern', () => {
      const doc = reducer(setup(), addAgentToolPattern({ agentId: 'main', pattern: '   ' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('must not be empty');
    });

    it('dedupes silently', () => {
      let doc = setup();
      doc = reducer(doc, addAgentToolPattern({ agentId: 'main', pattern: '*-mcp__*' }));
      doc = reducer(doc, addAgentToolPattern({ agentId: 'main', pattern: '*-mcp__*' }));
      expect(doc.state.global.features.mastra.mainAgent!.toolPatterns).toEqual(['*-mcp__*']);
    });
  });

  describe('REMOVE_AGENT_TOOL_PATTERN', () => {
    it('removes a tool pattern', () => {
      let doc = setup();
      doc = reducer(doc, addAgentToolPattern({ agentId: 'main', pattern: '*-mcp__*' }));
      doc = reducer(doc, removeAgentToolPattern({ agentId: 'main', pattern: '*-mcp__*' }));
      expect(doc.state.global.features.mastra.mainAgent!.toolPatterns).toEqual([]);
    });

    it('rejects when the pattern is not on the agent', () => {
      const doc = reducer(setup(), removeAgentToolPattern({ agentId: 'main', pattern: 'missing-*' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('not on agent');
    });
  });

  describe('rejects every binding op when Mastra is disabled', () => {
    it('SET_AGENT_MODEL', () => {
      const doc = reducer(utils.createDocument(), setAgentModel({ agentId: 'main', modelId: 'openai/gpt-4o' }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });

    it('ADD_AGENT_PROFILE_REF', () => {
      const doc = reducer(utils.createDocument(), addAgentProfileRef({ agentId: 'main', profileId: 'base' }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });

    it('REMOVE_AGENT_PROFILE_REF', () => {
      const doc = reducer(utils.createDocument(), removeAgentProfileRef({ agentId: 'main', profileId: 'base' }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });

    it('REORDER_AGENT_PROFILE_REFS', () => {
      const doc = reducer(utils.createDocument(), reorderAgentProfileRefs({ agentId: 'main', ids: ['base'], insertBefore: null }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });

    it('ADD_AGENT_SKILL', () => {
      const doc = reducer(utils.createDocument(), addAgentSkill({ agentId: 'main', name: 'a-skill' }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });

    it('REMOVE_AGENT_SKILL', () => {
      const doc = reducer(utils.createDocument(), removeAgentSkill({ agentId: 'main', name: 'a-skill' }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });

    it('ADD_AGENT_TOOL_PATTERN', () => {
      const doc = reducer(utils.createDocument(), addAgentToolPattern({ agentId: 'main', pattern: '*-mcp__*' }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });

    it('REMOVE_AGENT_TOOL_PATTERN', () => {
      const doc = reducer(utils.createDocument(), removeAgentToolPattern({ agentId: 'main', pattern: '*-mcp__*' }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });
  });

  describe('agent-not-found across binding ops', () => {
    it('ADD_AGENT_PROFILE_REF rejects unknown agentId', () => {
      const doc = reducer(setup(), addAgentProfileRef({ agentId: 'missing', profileId: 'base' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('Agent not found');
    });

    it('REMOVE_AGENT_PROFILE_REF rejects unknown agentId', () => {
      const doc = reducer(setup(), removeAgentProfileRef({ agentId: 'missing', profileId: 'base' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('Agent not found');
    });

    it('REORDER_AGENT_PROFILE_REFS rejects unknown agentId', () => {
      const doc = reducer(setup(), reorderAgentProfileRefs({ agentId: 'missing', ids: ['base'], insertBefore: null }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('Agent not found');
    });

    it('ADD_AGENT_SKILL rejects unknown agentId', () => {
      const doc = reducer(setup(), addAgentSkill({ agentId: 'missing', name: 'a-skill' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('Agent not found');
    });

    it('REMOVE_AGENT_SKILL rejects unknown agentId', () => {
      const doc = reducer(setup(), removeAgentSkill({ agentId: 'missing', name: 'a-skill' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('Agent not found');
    });

    it('ADD_AGENT_TOOL_PATTERN rejects unknown agentId', () => {
      const doc = reducer(setup(), addAgentToolPattern({ agentId: 'missing', pattern: '*-mcp__*' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('Agent not found');
    });

    it('REMOVE_AGENT_TOOL_PATTERN rejects unknown agentId', () => {
      const doc = reducer(setup(), removeAgentToolPattern({ agentId: 'missing', pattern: '*-mcp__*' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('Agent not found');
    });
  });

  describe('ADD_AGENT_PROFILE_REF insertBefore edge cases', () => {
    it('rejects when insertBefore ref is not in the agent profileIds', () => {
      let doc = setup();
      doc = reducer(
        doc,
        addAgentProfileRef({
          agentId: 'main',
          profileId: 'tools',
          insertBefore: 'style',
        }),
      );
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("insertBefore profile not in agent's profileIds");
    });
  });

  describe('REORDER_AGENT_PROFILE_REFS insertBefore edge cases', () => {
    it('rejects when insertBefore is not among the remaining refs', () => {
      let doc = setup();
      doc = reducer(doc, addAgentProfileRef({ agentId: 'main', profileId: 'tools' }));
      doc = reducer(
        doc,
        reorderAgentProfileRefs({
          agentId: 'main',
          ids: ['base'],
          insertBefore: 'base',
        }),
      );
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain("insertBefore profile not in agent's profileIds");
    });
  });
});
