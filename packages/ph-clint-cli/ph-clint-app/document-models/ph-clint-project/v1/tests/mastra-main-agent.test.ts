import { clearMainAgentDescription, clearMainAgentImage, enableMastra, reducer, setMainAgentDescription, setMainAgentImage, setMainAgentName, utils, type PhClintProjectDocument } from 'document-models/ph-clint-project/v1';
import { describe, expect, it } from 'vitest';

const ATTACHMENT_REF = 'attachment://v1:abc123deadbeef';

function enabled(): PhClintProjectDocument {
  return reducer(utils.createDocument(), enableMastra({ agentId: 'main', agentName: 'Main' }));
}

describe('MastraMainAgentOperations', () => {
  describe('SET_MAIN_AGENT_NAME', () => {
    it('trims and updates the name', () => {
      const doc = reducer(enabled(), setMainAgentName({ name: '  New Name  ' }));
      expect(doc.state.global.features.mastra.mainAgent!.name).toBe('New Name');
    });

    it('rejects when the name is empty after trim', () => {
      const doc = reducer(enabled(), setMainAgentName({ name: '   ' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('must not be empty');
      expect(doc.state.global.features.mastra.mainAgent!.name).toBe('Main');
    });

    it('rejects when mastra is disabled', () => {
      const doc = reducer(utils.createDocument(), setMainAgentName({ name: 'X' }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });
  });

  describe('SET_MAIN_AGENT_DESCRIPTION', () => {
    it('sets the description', () => {
      const doc = reducer(enabled(), setMainAgentDescription({ description: 'A helpful agent.' }));
      expect(doc.state.global.features.mastra.mainAgent!.description).toBe('A helpful agent.');
    });

    it('rejects when mastra is disabled', () => {
      const doc = reducer(utils.createDocument(), setMainAgentDescription({ description: 'X' }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });
  });

  describe('CLEAR_MAIN_AGENT_DESCRIPTION', () => {
    it('clears the description to null', () => {
      let doc = reducer(enabled(), setMainAgentDescription({ description: 'desc' }));
      doc = reducer(doc, clearMainAgentDescription({ _: true }));
      expect(doc.state.global.features.mastra.mainAgent!.description).toBeNull();
    });

    it('rejects when mastra is disabled', () => {
      const doc = reducer(utils.createDocument(), clearMainAgentDescription({ _: true }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });
  });

  describe('SET_MAIN_AGENT_IMAGE', () => {
    it('stores an attachment ref', () => {
      const doc = reducer(enabled(), setMainAgentImage({ attachment: ATTACHMENT_REF }));
      expect(doc.state.global.features.mastra.mainAgent!.attachment).toBe(ATTACHMENT_REF);
    });

    it('rejects a non-attachment-ref string', () => {
      const doc = reducer(enabled(), setMainAgentImage({ attachment: 'https://example.com/avatar.png' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('attachment://');
      expect(doc.state.global.features.mastra.mainAgent!.attachment).toBeNull();
    });

    it('rejects when mastra is disabled', () => {
      const doc = reducer(utils.createDocument(), setMainAgentImage({ attachment: ATTACHMENT_REF }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });
  });

  describe('CLEAR_MAIN_AGENT_IMAGE', () => {
    it('clears the attachment to null', () => {
      let doc = reducer(enabled(), setMainAgentImage({ attachment: ATTACHMENT_REF }));
      doc = reducer(doc, clearMainAgentImage({ _: true }));
      expect(doc.state.global.features.mastra.mainAgent!.attachment).toBeNull();
    });

    it('rejects when mastra is disabled', () => {
      const doc = reducer(utils.createDocument(), clearMainAgentImage({ _: true }));
      expect(doc.operations.global[0].error).toContain('Mastra is disabled');
    });
  });
});
