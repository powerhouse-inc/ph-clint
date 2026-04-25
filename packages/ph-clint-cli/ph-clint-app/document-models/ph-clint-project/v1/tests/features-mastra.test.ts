import { describe, expect, it } from 'vitest';
import {
  reducer,
  utils,
  enableMastra,
  disableMastra,
  setAgentId,
  setAgentName,
  addModel,
  removeModel,
  setDefaultModel,
  addProfile,
  updateProfile,
  removeProfile,
  reorderProfiles,
} from 'document-models/ph-clint-project/v1';

/** Helper: creates a document with mastra enabled */
function createEnabledDoc() {
  const doc = utils.createDocument();
  return reducer(doc, enableMastra({ agentId: 'test-agent', agentName: 'Test Agent' }));
}

/** Helper: creates enabled doc with some models */
function createDocWithModels() {
  let doc = createEnabledDoc();
  doc = reducer(doc, addModel({ id: 'anthropic/claude-sonnet-4-5' }));
  doc = reducer(doc, addModel({ id: 'openai/gpt-4o' }));
  doc = reducer(doc, addModel({ id: 'anthropic/claude-haiku-4-5' }));
  return doc;
}

/** Helper: creates enabled doc with some profiles */
function createDocWithProfiles() {
  let doc = createEnabledDoc();
  doc = reducer(doc, addProfile({ id: 'base', title: 'Base', content: 'Base instructions.' }));
  doc = reducer(doc, addProfile({ id: 'tools', title: 'Tools', content: 'Tool usage.' }));
  doc = reducer(doc, addProfile({ id: 'style', title: 'Style', content: 'Style guide.' }));
  return doc;
}

describe('ENABLE_MASTRA', () => {
  it('should set enabled, agentId, and agentName', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, enableMastra({ agentId: 'my-agent', agentName: 'My Agent' }));

    expect(updated.state.global.features.mastra.enabled).toBe(true);
    expect(updated.state.global.features.mastra.agentId).toBe('my-agent');
    expect(updated.state.global.features.mastra.agentName).toBe('My Agent');
    expect(updated.operations.global[0].error).toBeUndefined();
  });

  it('should trim agentName', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, enableMastra({ agentId: 'my-agent', agentName: '  My Agent  ' }));

    expect(updated.state.global.features.mastra.agentName).toBe('My Agent');
  });

  it('should reject invalid agentId', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, enableMastra({ agentId: 'Invalid-ID', agentName: 'Agent' }));

    expect(updated.operations.global[0].error).toContain('Invalid agent ID');
    expect(updated.state.global.features.mastra.enabled).toBe(false);
  });

  it('should reject empty agentName', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, enableMastra({ agentId: 'my-agent', agentName: '   ' }));

    expect(updated.operations.global[0].error).toContain('must not be empty');
    expect(updated.state.global.features.mastra.enabled).toBe(false);
  });
});

describe('DISABLE_MASTRA', () => {
  it('should clear all mastra state', () => {
    let doc = createEnabledDoc();
    doc = reducer(doc, addModel({ id: 'anthropic/claude-sonnet-4-5' }));
    doc = reducer(doc, addProfile({ id: 'base', title: 'Base', content: 'content' }));

    const disabled = reducer(doc, disableMastra({ _: true }));

    expect(disabled.state.global.features.mastra.enabled).toBe(false);
    expect(disabled.state.global.features.mastra.agentId).toBeNull();
    expect(disabled.state.global.features.mastra.agentName).toBeNull();
    expect(disabled.state.global.features.mastra.models).toEqual([]);
    expect(disabled.state.global.features.mastra.profiles).toEqual([]);
  });
});

describe('SET_AGENT_ID', () => {
  it('should update agentId when enabled', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, setAgentId({ agentId: 'new-agent' }));

    expect(updated.state.global.features.mastra.agentId).toBe('new-agent');
  });

  it('should reject when mastra is disabled', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, setAgentId({ agentId: 'new-agent' }));

    expect(updated.operations.global[0].error).toContain('Mastra is disabled');
  });

  it('should reject invalid agentId format', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, setAgentId({ agentId: '123-bad' }));

    expect(updated.operations.global[1].error).toContain('Invalid agent ID');
    expect(updated.state.global.features.mastra.agentId).toBe('test-agent');
  });
});

describe('SET_AGENT_NAME', () => {
  it('should update agentName when enabled', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, setAgentName({ agentName: 'New Name' }));

    expect(updated.state.global.features.mastra.agentName).toBe('New Name');
  });

  it('should trim the name', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, setAgentName({ agentName: '  Trimmed  ' }));

    expect(updated.state.global.features.mastra.agentName).toBe('Trimmed');
  });

  it('should reject when mastra is disabled', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, setAgentName({ agentName: 'Agent' }));

    expect(updated.operations.global[0].error).toContain('Mastra is disabled');
  });

  it('should reject empty name after trim', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, setAgentName({ agentName: '   ' }));

    expect(updated.operations.global[1].error).toContain('must not be empty');
  });
});

describe('ADD_MODEL', () => {
  it('should add first model as default', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, addModel({ id: 'anthropic/claude-sonnet-4-5' }));

    expect(updated.state.global.features.mastra.models).toEqual([
      { id: 'anthropic/claude-sonnet-4-5', isDefault: true },
    ]);
  });

  it('should add second model as non-default', () => {
    let doc = createEnabledDoc();
    doc = reducer(doc, addModel({ id: 'anthropic/claude-sonnet-4-5' }));
    const updated = reducer(doc, addModel({ id: 'openai/gpt-4o' }));

    expect(updated.state.global.features.mastra.models).toEqual([
      { id: 'anthropic/claude-sonnet-4-5', isDefault: true },
      { id: 'openai/gpt-4o', isDefault: false },
    ]);
  });

  it('should switch default when isDefault is true', () => {
    let doc = createEnabledDoc();
    doc = reducer(doc, addModel({ id: 'anthropic/claude-sonnet-4-5' }));
    const updated = reducer(doc, addModel({ id: 'openai/gpt-4o', isDefault: true }));

    expect(updated.state.global.features.mastra.models).toEqual([
      { id: 'anthropic/claude-sonnet-4-5', isDefault: false },
      { id: 'openai/gpt-4o', isDefault: true },
    ]);
  });

  it('should reject invalid model ID format', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, addModel({ id: 'no-slash' }));

    expect(updated.operations.global[1].error).toContain('Invalid model ID');
  });

  it('should reject duplicate model', () => {
    let doc = createEnabledDoc();
    doc = reducer(doc, addModel({ id: 'anthropic/claude-sonnet-4-5' }));
    const updated = reducer(doc, addModel({ id: 'anthropic/claude-sonnet-4-5' }));

    expect(updated.operations.global[2].error).toContain('already exists');
  });

  it('should reject when mastra is disabled', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, addModel({ id: 'anthropic/claude-sonnet-4-5' }));

    expect(updated.operations.global[0].error).toContain('Mastra is disabled');
  });
});

describe('REMOVE_MODEL', () => {
  it('should remove a non-default model', () => {
    const doc = createDocWithModels();
    const updated = reducer(doc, removeModel({ id: 'openai/gpt-4o' }));

    expect(updated.state.global.features.mastra.models).toHaveLength(2);
    expect(updated.state.global.features.mastra.models.find(m => m.id === 'openai/gpt-4o')).toBeUndefined();
    // Default unchanged
    expect(updated.state.global.features.mastra.models[0].isDefault).toBe(true);
  });

  it('should promote first remaining when removing default', () => {
    const doc = createDocWithModels();
    const updated = reducer(doc, removeModel({ id: 'anthropic/claude-sonnet-4-5' }));

    expect(updated.state.global.features.mastra.models).toHaveLength(2);
    expect(updated.state.global.features.mastra.models[0].id).toBe('openai/gpt-4o');
    expect(updated.state.global.features.mastra.models[0].isDefault).toBe(true);
  });

  it('should allow removing the last model', () => {
    let doc = createEnabledDoc();
    doc = reducer(doc, addModel({ id: 'anthropic/claude-sonnet-4-5' }));
    const updated = reducer(doc, removeModel({ id: 'anthropic/claude-sonnet-4-5' }));

    expect(updated.state.global.features.mastra.models).toEqual([]);
  });

  it('should error on non-existent model', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, removeModel({ id: 'nope/nope' }));

    expect(updated.operations.global[1].error).toContain('not found');
  });

  it('should reject when mastra is disabled', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, removeModel({ id: 'anthropic/claude-sonnet-4-5' }));

    expect(updated.operations.global[0].error).toContain('Mastra is disabled');
  });
});

describe('SET_DEFAULT_MODEL', () => {
  it('should switch default model', () => {
    const doc = createDocWithModels();
    const updated = reducer(doc, setDefaultModel({ id: 'openai/gpt-4o' }));

    const models = updated.state.global.features.mastra.models;
    expect(models.find(m => m.id === 'anthropic/claude-sonnet-4-5')!.isDefault).toBe(false);
    expect(models.find(m => m.id === 'openai/gpt-4o')!.isDefault).toBe(true);
    expect(models.find(m => m.id === 'anthropic/claude-haiku-4-5')!.isDefault).toBe(false);
  });

  it('should error on non-existent model', () => {
    const doc = createDocWithModels();
    const updated = reducer(doc, setDefaultModel({ id: 'nope/nope' }));

    expect(updated.operations.global[4].error).toContain('not found');
  });

  it('should reject when mastra is disabled', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, setDefaultModel({ id: 'anthropic/claude-sonnet-4-5' }));

    expect(updated.operations.global[0].error).toContain('Mastra is disabled');
  });
});

describe('ADD_PROFILE', () => {
  it('should append profile to end by default', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, addProfile({ id: 'base', title: 'Base', content: 'Hello' }));

    expect(updated.state.global.features.mastra.profiles).toEqual([
      { id: 'base', title: 'Base', content: 'Hello' },
    ]);
  });

  it('should insert before specified profile', () => {
    let doc = createEnabledDoc();
    doc = reducer(doc, addProfile({ id: 'first', title: 'First', content: 'a' }));
    doc = reducer(doc, addProfile({ id: 'third', title: 'Third', content: 'c' }));
    const updated = reducer(doc, addProfile({ id: 'second', title: 'Second', content: 'b', insertBefore: 'third' }));

    const ids = updated.state.global.features.mastra.profiles.map(p => p.id);
    expect(ids).toEqual(['first', 'second', 'third']);
  });

  it('should reject invalid profile ID', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, addProfile({ id: '123bad', title: 'T', content: 'c' }));

    expect(updated.operations.global[1].error).toContain('Invalid profile ID');
  });

  it('should reject duplicate profile ID', () => {
    let doc = createEnabledDoc();
    doc = reducer(doc, addProfile({ id: 'base', title: 'Base', content: 'c' }));
    const updated = reducer(doc, addProfile({ id: 'base', title: 'Base2', content: 'c2' }));

    expect(updated.operations.global[2].error).toContain('already exists');
  });

  it('should error when insertBefore target does not exist', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, addProfile({ id: 'new', title: 'T', content: 'c', insertBefore: 'nonexistent' }));

    expect(updated.operations.global[1].error).toContain('insertBefore profile not found');
  });

  it('should reject when mastra is disabled', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, addProfile({ id: 'base', title: 'Base', content: 'c' }));

    expect(updated.operations.global[0].error).toContain('Mastra is disabled');
  });
});

describe('UPDATE_PROFILE', () => {
  it('should update title only', () => {
    const doc = createDocWithProfiles();
    const updated = reducer(doc, updateProfile({ id: 'base', title: 'New Title' }));

    const profile = updated.state.global.features.mastra.profiles.find(p => p.id === 'base')!;
    expect(profile.title).toBe('New Title');
    expect(profile.content).toBe('Base instructions.');
  });

  it('should update content only', () => {
    const doc = createDocWithProfiles();
    const updated = reducer(doc, updateProfile({ id: 'base', content: 'New content.' }));

    const profile = updated.state.global.features.mastra.profiles.find(p => p.id === 'base')!;
    expect(profile.title).toBe('Base');
    expect(profile.content).toBe('New content.');
  });

  it('should update both title and content', () => {
    const doc = createDocWithProfiles();
    const updated = reducer(doc, updateProfile({ id: 'base', title: 'Updated', content: 'Updated content.' }));

    const profile = updated.state.global.features.mastra.profiles.find(p => p.id === 'base')!;
    expect(profile.title).toBe('Updated');
    expect(profile.content).toBe('Updated content.');
  });

  it('should error on non-existent profile', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, updateProfile({ id: 'nonexistent', title: 'T' }));

    expect(updated.operations.global[1].error).toContain('not found');
  });

  it('should reject when mastra is disabled', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, updateProfile({ id: 'base', title: 'T' }));

    expect(updated.operations.global[0].error).toContain('Mastra is disabled');
  });
});

describe('REMOVE_PROFILE', () => {
  it('should remove a profile', () => {
    const doc = createDocWithProfiles();
    const updated = reducer(doc, removeProfile({ id: 'tools' }));

    const ids = updated.state.global.features.mastra.profiles.map(p => p.id);
    expect(ids).toEqual(['base', 'style']);
  });

  it('should error on non-existent profile', () => {
    const doc = createEnabledDoc();
    const updated = reducer(doc, removeProfile({ id: 'nonexistent' }));

    expect(updated.operations.global[1].error).toContain('not found');
  });

  it('should reject when mastra is disabled', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, removeProfile({ id: 'base' }));

    expect(updated.operations.global[0].error).toContain('Mastra is disabled');
  });
});

describe('REORDER_PROFILES', () => {
  it('should move single profile to end', () => {
    const doc = createDocWithProfiles();
    const updated = reducer(doc, reorderProfiles({ ids: ['base'], insertBefore: null }));

    const ids = updated.state.global.features.mastra.profiles.map(p => p.id);
    expect(ids).toEqual(['tools', 'style', 'base']);
  });

  it('should move single profile before another', () => {
    const doc = createDocWithProfiles();
    const updated = reducer(doc, reorderProfiles({ ids: ['style'], insertBefore: 'base' }));

    const ids = updated.state.global.features.mastra.profiles.map(p => p.id);
    expect(ids).toEqual(['style', 'base', 'tools']);
  });

  it('should move multiple profiles before another', () => {
    const doc = createDocWithProfiles();
    const updated = reducer(doc, reorderProfiles({ ids: ['tools', 'style'], insertBefore: 'base' }));

    const ids = updated.state.global.features.mastra.profiles.map(p => p.id);
    expect(ids).toEqual(['tools', 'style', 'base']);
  });

  it('should move multiple profiles to end', () => {
    let doc = createDocWithProfiles();
    doc = reducer(doc, addProfile({ id: 'extra', title: 'Extra', content: 'Extra.' }));
    const updated = reducer(doc, reorderProfiles({ ids: ['base', 'tools'], insertBefore: null }));

    const ids = updated.state.global.features.mastra.profiles.map(p => p.id);
    expect(ids).toEqual(['style', 'extra', 'base', 'tools']);
  });

  it('should error when a moved profile does not exist', () => {
    const doc = createDocWithProfiles();
    const updated = reducer(doc, reorderProfiles({ ids: ['nonexistent'], insertBefore: null }));

    expect(updated.operations.global[4].error).toContain('not found');
  });

  it('should error when insertBefore target does not exist', () => {
    const doc = createDocWithProfiles();
    const updated = reducer(doc, reorderProfiles({ ids: ['base'], insertBefore: 'nonexistent' }));

    expect(updated.operations.global[4].error).toContain('insertBefore profile not found');
  });

  it('should reject when mastra is disabled', () => {
    const doc = utils.createDocument();
    const updated = reducer(doc, reorderProfiles({ ids: ['base'], insertBefore: null }));

    expect(updated.operations.global[0].error).toContain('Mastra is disabled');
  });
});
