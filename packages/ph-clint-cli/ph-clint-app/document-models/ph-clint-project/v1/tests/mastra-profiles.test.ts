import { addProfile, enableMastra, reducer, removeProfile, reorderProfiles, updateProfile, utils, type PhClintProjectDocument } from 'document-models/ph-clint-project/v1';
import { describe, expect, it } from 'vitest';

function enabled(): PhClintProjectDocument {
  return reducer(utils.createDocument(), enableMastra({ agentId: 'main', agentName: 'Main' }));
}

describe('MastraProfilesOperations', () => {
  describe('ADD_PROFILE', () => {
    it('appends a new profile when insertBefore is omitted', () => {
      let doc = enabled();
      doc = reducer(doc, addProfile({ id: 'tools', title: 'Tools', content: 'Tool usage.' }));
      const ids = doc.state.global.features.mastra.profiles.map((p) => p.id);
      expect(ids).toEqual(['base', 'tools']);
    });

    it('inserts before the named profile when insertBefore is provided', () => {
      let doc = enabled();
      doc = reducer(doc, addProfile({ id: 'tools', title: 'Tools', content: '' }));
      doc = reducer(
        doc,
        addProfile({
          id: 'style',
          title: 'Style',
          content: '',
          insertBefore: 'tools',
        }),
      );
      const ids = doc.state.global.features.mastra.profiles.map((p) => p.id);
      expect(ids).toEqual(['base', 'style', 'tools']);
    });

    it('rejects invalid profile id format', () => {
      const doc = reducer(enabled(), addProfile({ id: 'Bad-ID', title: 'x', content: '' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('lowercase kebab-case');
    });

    it('rejects duplicates', () => {
      const doc = reducer(enabled(), addProfile({ id: 'base', title: 'Dup', content: '' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('already exists');
    });

    it('rejects an unknown insertBefore', () => {
      const doc = reducer(
        enabled(),
        addProfile({
          id: 'tools',
          title: 'Tools',
          content: '',
          insertBefore: 'missing',
        }),
      );
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('not found');
    });
  });

  describe('UPDATE_PROFILE', () => {
    it('updates title only when content is omitted', () => {
      let doc = enabled();
      doc = reducer(doc, updateProfile({ id: 'base', title: 'Renamed' }));
      const profile = doc.state.global.features.mastra.profiles.find((p) => p.id === 'base')!;
      expect(profile.title).toBe('Renamed');
      expect(profile.content).toBe('You are a helpful assistant.');
    });

    it('rejects when the profile does not exist', () => {
      const doc = reducer(enabled(), updateProfile({ id: 'missing', title: 'x' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('not found');
    });
  });

  describe('REMOVE_PROFILE', () => {
    it('rejects when in use by the main agent', () => {
      const doc = reducer(enabled(), removeProfile({ id: 'base' }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('in use');
      expect(doc.state.global.features.mastra.profiles.find((p) => p.id === 'base')).toBeDefined();
    });

    it('removes an unused profile', () => {
      let doc = enabled();
      doc = reducer(doc, addProfile({ id: 'tools', title: 'Tools', content: '' }));
      doc = reducer(doc, removeProfile({ id: 'tools' }));
      expect(doc.state.global.features.mastra.profiles.find((p) => p.id === 'tools')).toBeUndefined();
    });
  });

  describe('REORDER_PROFILES', () => {
    it('moves named profiles before insertBefore', () => {
      let doc = enabled();
      doc = reducer(doc, addProfile({ id: 'tools', title: 'T', content: '' }));
      doc = reducer(doc, addProfile({ id: 'style', title: 'S', content: '' }));
      doc = reducer(doc, reorderProfiles({ ids: ['style'], insertBefore: 'tools' }));
      const ids = doc.state.global.features.mastra.profiles.map((p) => p.id);
      expect(ids).toEqual(['base', 'style', 'tools']);
    });

    it('appends moved profiles when insertBefore is null', () => {
      let doc = enabled();
      doc = reducer(doc, addProfile({ id: 'tools', title: 'T', content: '' }));
      doc = reducer(doc, addProfile({ id: 'style', title: 'S', content: '' }));
      doc = reducer(doc, reorderProfiles({ ids: ['base'], insertBefore: null }));
      const ids = doc.state.global.features.mastra.profiles.map((p) => p.id);
      expect(ids).toEqual(['tools', 'style', 'base']);
    });

    it('rejects when any referenced id is missing', () => {
      const doc = reducer(enabled(), reorderProfiles({ ids: ['missing'], insertBefore: null }));
      const op = doc.operations.global[doc.operations.global.length - 1];
      expect(op.error).toContain('Profile not found');
    });
  });
});
