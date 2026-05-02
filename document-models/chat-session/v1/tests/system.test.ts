import { addSystemMessage, endSession, reducer, setAgentDescription, setAgentImage, setAgentInfo, startSession, updateUsageSummary, utils } from 'document-models/chat-session/v1';
import { describe, expect, it } from 'vitest';

describe('SystemOperations', () => {
  it('setAgentInfo: partial updates and agent creation branches', () => {
    // on fresh doc, agent is null — should create it
    let doc = reducer(utils.createDocument(), setAgentInfo({ name: 'TestBot' }));

    expect(doc.state.global.agent).toStrictEqual({
      id: null,
      name: 'TestBot',
      model: null,
      instructions: null,
      description: null,
      image: null,
      imageMediaType: null,
      imageUrl: null,
    });

    // agent already exists — partial update preserves other fields
    doc = reducer(doc, setAgentInfo({ model: 'gpt-4' }));

    expect(doc.state.global.agent).toStrictEqual({
      id: null,
      name: 'TestBot',
      model: 'gpt-4',
      instructions: null,
      description: null,
      image: null,
      imageMediaType: null,
      imageUrl: null,
    });

    // update id specifically
    doc = reducer(doc, setAgentInfo({ id: 'agent-42' }));
    expect(doc.state.global.agent!.id).toBe('agent-42');

    // all-empty input — no fields change
    doc = reducer(doc, setAgentInfo({}));

    expect(doc.state.global.agent).toStrictEqual({
      id: 'agent-42',
      name: 'TestBot',
      model: 'gpt-4',
      instructions: null,
      description: null,
      image: null,
      imageMediaType: null,
      imageUrl: null,
    });

    // startSession with minimal agent — all fields default to null
    const doc3 = reducer(
      utils.createDocument(),
      startSession({
        threadId: 't2',
        resourceId: 'r2',
        startedAt: '2025-01-01T00:00:00Z',
        agent: {},
      }),
    );
    expect(doc3.state.global.agent).toStrictEqual({
      id: null,
      name: null,
      model: null,
      instructions: null,
      description: null,
      image: null,
      imageMediaType: null,
      imageUrl: null,
    });

    // also verify the false branch after startSession sets agent
    let doc2 = reducer(
      utils.createDocument(),
      startSession({
        threadId: 't',
        resourceId: 'r',
        startedAt: '2025-01-01T00:00:00Z',
        agent: { id: 'a1', name: 'Bot', model: 'm1', instructions: 'be nice' },
      }),
    );
    doc2 = reducer(doc2, setAgentInfo({ instructions: 'be helpful' }));

    expect(doc2.state.global.agent).toStrictEqual({
      id: 'a1',
      name: 'Bot',
      model: 'm1',
      instructions: 'be helpful',
      description: null,
      image: null,
      imageMediaType: null,
      imageUrl: null,
    });
  });

  it('updateUsageSummary: creation from null, partial updates, zero values, all-null no-op', () => {
    // fresh doc has usage: null — should create with zero defaults
    let doc = reducer(utils.createDocument(), updateUsageSummary({ totalPromptTokens: 100 }));

    expect(doc.state.global.usage).toStrictEqual({
      totalPromptTokens: 100,
      totalCompletionTokens: 0,
      totalTokens: 0,
      totalSteps: 0,
      totalMessages: 0,
      totalToolCalls: 0,
    });

    // partial update — only provided fields change
    doc = reducer(doc, updateUsageSummary({ totalSteps: 5, totalTokens: 999 }));

    expect(doc.state.global.usage!.totalPromptTokens).toBe(100); // unchanged
    expect(doc.state.global.usage!.totalSteps).toBe(5);
    expect(doc.state.global.usage!.totalTokens).toBe(999);

    // explicit 0 overwrites (not skipped)
    doc = reducer(doc, updateUsageSummary({ totalPromptTokens: 0 }));
    expect(doc.state.global.usage!.totalPromptTokens).toBe(0);

    // all-null input — nothing changes
    const before = { ...doc.state.global.usage! };
    doc = reducer(
      doc,
      updateUsageSummary({
        totalPromptTokens: null,
        totalCompletionTokens: null,
        totalTokens: null,
        totalSteps: null,
        totalMessages: null,
        totalToolCalls: null,
      }),
    );
    expect(doc.state.global.usage).toStrictEqual(before);
  });

  it('startSession: initializes all fields including description, image defaults to null', () => {
    const doc = reducer(
      utils.createDocument(),
      startSession({
        threadId: 't1',
        resourceId: 'r1',
        startedAt: '2025-01-01T00:00:00Z',
        agent: { name: 'TestBot', description: 'My assistant' },
      }),
    );

    expect(doc.state.global.threadId).toBe('t1');
    expect(doc.state.global.resourceId).toBe('r1');
    expect(doc.state.global.status).toBe('ACTIVE');
    expect(doc.state.global.startedAt).toBe('2025-01-01T00:00:00Z');
    expect(doc.state.global.agent).toStrictEqual({
      id: null,
      name: 'TestBot',
      model: null,
      instructions: null,
      description: 'My assistant',
      image: null,
      imageMediaType: null,
      imageUrl: null,
    });
    expect(doc.state.global.usage).toStrictEqual({
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      totalSteps: 0,
      totalMessages: 0,
      totalToolCalls: 0,
    });
  });

  it('endSession: sets status and endedAt', () => {
    let doc = reducer(
      utils.createDocument(),
      startSession({
        threadId: 't',
        resourceId: 'r',
        startedAt: '2025-01-01T00:00:00Z',
        agent: { name: 'Bot' },
      }),
    );
    doc = reducer(doc, endSession({ status: 'COMPLETED', endedAt: '2025-01-01T01:00:00Z' }));

    expect(doc.state.global.status).toBe('COMPLETED');
    expect(doc.state.global.endedAt).toBe('2025-01-01T01:00:00Z');
  });

  it('addSystemMessage: pushes message and increments usage counter', () => {
    let doc = reducer(
      utils.createDocument(),
      startSession({
        threadId: 't',
        resourceId: 'r',
        startedAt: '2025-01-01T00:00:00Z',
        agent: {},
      }),
    );
    doc = reducer(doc, addSystemMessage({ id: 'msg-1', text: 'You are helpful.', createdAt: '2025-01-01T00:00:01Z' }));

    expect(doc.state.global.messages).toHaveLength(1);
    expect(doc.state.global.messages[0].role).toBe('SYSTEM');
    expect(doc.state.global.messages[0].content[0].text).toBe('You are helpful.');
    expect(doc.state.global.usage!.totalMessages).toBe(1);
  });

  it('setAgentImage: sets base64, URL, and clears image', () => {
    // sets image on fresh doc (agent is null → creates agent)
    let doc = reducer(utils.createDocument(), setAgentImage({ data: 'iVBOR...', mediaType: 'image/png' }));
    expect(doc.state.global.agent!.image).toBe('iVBOR...');
    expect(doc.state.global.agent!.imageMediaType).toBe('image/png');
    expect(doc.state.global.agent!.imageUrl).toBeNull();

    // set via URL instead — clears base64 fields
    doc = reducer(doc, setAgentImage({ url: 'https://example.com/avatar.png' }));
    expect(doc.state.global.agent!.image).toBeNull();
    expect(doc.state.global.agent!.imageMediaType).toBeNull();
    expect(doc.state.global.agent!.imageUrl).toBe('https://example.com/avatar.png');

    // clear image entirely
    doc = reducer(doc, setAgentImage({}));
    expect(doc.state.global.agent!.image).toBeNull();
    expect(doc.state.global.agent!.imageMediaType).toBeNull();
    expect(doc.state.global.agent!.imageUrl).toBeNull();
  });

  it('setAgentDescription: sets description, creates agent if null', () => {
    // creates agent when null
    let doc = reducer(utils.createDocument(), setAgentDescription({ description: 'A helpful assistant' }));
    expect(doc.state.global.agent!.description).toBe('A helpful assistant');
    expect(doc.state.global.agent!.name).toBeNull();

    // updates existing agent description
    doc = reducer(doc, setAgentInfo({ name: 'Bot' }));
    doc = reducer(doc, setAgentDescription({ description: 'Updated bio' }));
    expect(doc.state.global.agent!.description).toBe('Updated bio');
    expect(doc.state.global.agent!.name).toBe('Bot');
  });

  it('setAgentInfo: partial update includes description', () => {
    let doc = reducer(utils.createDocument(), setAgentInfo({ name: 'Bot', description: 'A bot' }));
    expect(doc.state.global.agent!.description).toBe('A bot');

    // partial update doesn't clobber description
    doc = reducer(doc, setAgentInfo({ model: 'gpt-4' }));
    expect(doc.state.global.agent!.description).toBe('A bot');
    expect(doc.state.global.agent!.model).toBe('gpt-4');
  });
});
