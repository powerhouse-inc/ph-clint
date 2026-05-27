import { addModel, addSubAgent, enableMastra, reducer, removeSubAgent, setSubAgentDescription, setSubAgentName, utils, type PhClintProjectDocument } from 'document-models/ph-clint-project/v1';
import { describe, expect, it } from 'vitest';

/** Helper: enabled doc with an extra model so sub-agents can reference it. */
function enabledWithExtraModel(): PhClintProjectDocument {
  let doc = reducer(utils.createDocument(), enableMastra({ agentId: 'main', agentName: 'Main' }));
  doc = reducer(doc, addModel({ id: 'openai/gpt-4o' }));
  return doc;
}

describe('MastraSubAgentsOperations', () => {
  describe('ADD_SUB_AGENT', () => {
    it('adds a sub-agent with empty bindings', () => {
      let doc = enabledWithExtraModel();
      doc = reducer(
        doc,
        addSubAgent({
          id: 'summarizer',
          name: 'Summarizer',
          description: 'Summarizes content.',
          modelId: 'openai/gpt-4o',
        }),
      );
      const subs = doc.state.global.features.mastra.subAgents;
      expect(subs).toHaveLength(1);
      expect(subs[0]).toEqual({
        id: 'summarizer',
        name: 'Summarizer',
        description: 'Summarizes content.',
        modelId: 'openai/gpt-4o',
        profileIds: [],
        skills: [],
        toolPatterns: [],
      });
    });

    it('trims name', () => {
      let doc = enabledWithExtraModel();
      doc = reducer(
        doc,
        addSubAgent({
          id: 'summarizer',
          name: '  Summarizer  ',
          description: 'x',
          modelId: 'openai/gpt-4o',
        }),
      );
      expect(doc.state.global.features.mastra.subAgents[0].name).toBe('Summarizer');
    });

    it('rejects when the id collides with the main agent', () => {
      const doc = reducer(
        enabledWithExtraModel(),
        addSubAgent({
          id: 'main',
          name: 'Main Clone',
          description: 'x',
          modelId: 'openai/gpt-4o',
        }),
      );
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('already taken by main agent');
    });

    it('rejects duplicate sub-agent id', () => {
      let doc = enabledWithExtraModel();
      doc = reducer(
        doc,
        addSubAgent({
          id: 'sub',
          name: 'Sub',
          description: 'x',
          modelId: 'openai/gpt-4o',
        }),
      );
      doc = reducer(
        doc,
        addSubAgent({
          id: 'sub',
          name: 'Sub2',
          description: 'x',
          modelId: 'openai/gpt-4o',
        }),
      );
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('already exists');
    });

    it('rejects when modelId is not in the library', () => {
      const doc = reducer(
        enabledWithExtraModel(),
        addSubAgent({
          id: 'sub',
          name: 'Sub',
          description: 'x',
          modelId: 'missing/x',
        }),
      );
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('Model not in library');
    });

    it('rejects invalid id format', () => {
      const doc = reducer(
        enabledWithExtraModel(),
        addSubAgent({
          id: 'Bad-ID',
          name: 'Sub',
          description: 'x',
          modelId: 'openai/gpt-4o',
        }),
      );
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('lowercase kebab-case');
    });

    it('rejects when mastra is disabled', () => {
      const doc = reducer(
        utils.createDocument(),
        addSubAgent({
          id: 'sub',
          name: 'Sub',
          description: 'x',
          modelId: 'missing/x',
        }),
      );
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });
  });

  describe('REMOVE_SUB_AGENT', () => {
    it('removes a sub-agent', () => {
      let doc = enabledWithExtraModel();
      doc = reducer(
        doc,
        addSubAgent({
          id: 'sub',
          name: 'Sub',
          description: 'x',
          modelId: 'openai/gpt-4o',
        }),
      );
      doc = reducer(doc, removeSubAgent({ id: 'sub' }));
      expect(doc.state.global.features.mastra.subAgents).toEqual([]);
    });

    it('rejects when the sub-agent does not exist', () => {
      const doc = reducer(enabledWithExtraModel(), removeSubAgent({ id: 'missing' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('not found');
    });
  });

  describe('SET_SUB_AGENT_NAME', () => {
    it('trims and updates the name', () => {
      let doc = enabledWithExtraModel();
      doc = reducer(
        doc,
        addSubAgent({
          id: 'sub',
          name: 'Sub',
          description: 'x',
          modelId: 'openai/gpt-4o',
        }),
      );
      doc = reducer(doc, setSubAgentName({ id: 'sub', name: '  Renamed  ' }));
      expect(doc.state.global.features.mastra.subAgents[0].name).toBe('Renamed');
    });

    it('rejects when the name is empty after trim', () => {
      let doc = enabledWithExtraModel();
      doc = reducer(
        doc,
        addSubAgent({
          id: 'sub',
          name: 'Sub',
          description: 'x',
          modelId: 'openai/gpt-4o',
        }),
      );
      doc = reducer(doc, setSubAgentName({ id: 'sub', name: '  ' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('must not be empty');
    });
  });

  describe('SET_SUB_AGENT_DESCRIPTION', () => {
    it('updates the description', () => {
      let doc = enabledWithExtraModel();
      doc = reducer(
        doc,
        addSubAgent({
          id: 'sub',
          name: 'Sub',
          description: 'old',
          modelId: 'openai/gpt-4o',
        }),
      );
      doc = reducer(doc, setSubAgentDescription({ id: 'sub', description: 'new' }));
      expect(doc.state.global.features.mastra.subAgents[0].description).toBe('new');
    });

    it('rejects when the sub-agent does not exist', () => {
      const doc = reducer(enabledWithExtraModel(), setSubAgentDescription({ id: 'missing', description: 'x' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('not found');
    });
  });
});
