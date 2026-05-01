import { describe, expect, it } from 'vitest';
import { reducer, utils, addSupportedResource, removeSupportedResource, setProxyEnabled } from 'document-models/ph-clint-project/v1';

describe('DeploymentOperations', () => {
  describe('SET_PROXY_ENABLED', () => {
    it('should enable proxy', () => {
      const doc = utils.createDocument();
      const updated = reducer(doc, setProxyEnabled({ enabled: true }));

      expect(updated.state.global.deployment.proxyEnabled).toBe(true);
      expect(updated.operations.global[0].error).toBeUndefined();
    });

    it('should disable proxy', () => {
      let doc = utils.createDocument();
      doc = reducer(doc, setProxyEnabled({ enabled: true }));
      const updated = reducer(doc, setProxyEnabled({ enabled: false }));

      expect(updated.state.global.deployment.proxyEnabled).toBe(false);
    });
  });

  describe('ADD_SUPPORTED_RESOURCE', () => {
    it('should add a resource', () => {
      const doc = utils.createDocument();
      const updated = reducer(doc, addSupportedResource({ resource: 'custom-resource' }));

      expect(updated.state.global.deployment.supportedResources).toContain('custom-resource');
      expect(updated.operations.global[0].error).toBeUndefined();
    });

    it('should reject duplicate resource', () => {
      let doc = utils.createDocument();
      doc = reducer(doc, addSupportedResource({ resource: 'my-resource' }));
      const updated = reducer(doc, addSupportedResource({ resource: 'my-resource' }));

      expect(updated.operations.global[1].error).toContain('already exists');
    });

    it('should reject duplicate from initial state', () => {
      const doc = utils.createDocument();
      const updated = reducer(doc, addSupportedResource({ resource: 'vetra-agent-s' }));

      expect(updated.operations.global[0].error).toContain('already exists');
    });
  });

  describe('REMOVE_SUPPORTED_RESOURCE', () => {
    it('should remove a resource', () => {
      const doc = utils.createDocument();
      const updated = reducer(doc, removeSupportedResource({ resource: 'vetra-agent-s' }));

      expect(updated.state.global.deployment.supportedResources).not.toContain('vetra-agent-s');
      expect(updated.operations.global[0].error).toBeUndefined();
    });

    it('should error on non-existent resource', () => {
      const doc = utils.createDocument();
      const updated = reducer(doc, removeSupportedResource({ resource: 'nonexistent' }));

      expect(updated.operations.global[0].error).toContain('not found');
    });
  });
});
