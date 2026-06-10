import { hasMessageContent } from 'document-models/chat-session/v1';
import type { ContentPart } from 'document-models/chat-session/v1';
import { describe, expect, it } from 'vitest';

const part = (overrides: Partial<ContentPart> & Pick<ContentPart, 'type'>): ContentPart => ({
  id: 'p1',
  text: null,
  toolCallId: null,
  toolName: null,
  args: null,
  result: null,
  isError: null,
  mediaType: null,
  url: null,
  attachment: null,
  filename: null,
  error: null,
  ...overrides,
});

describe('hasMessageContent', () => {
  it('is false for an empty content list', () => {
    expect(hasMessageContent({ content: [] })).toBe(false);
  });

  it('is false for a TEXT part without text', () => {
    expect(hasMessageContent({ content: [part({ type: 'TEXT' })] })).toBe(false);
  });

  it('is true for a TEXT part with text', () => {
    expect(hasMessageContent({ content: [part({ type: 'TEXT', text: 'hi' })] })).toBe(true);
  });

  it('is true for IMAGE and FILE attachment parts', () => {
    expect(hasMessageContent({ content: [part({ type: 'IMAGE', attachment: 'a1' })] })).toBe(true);
    expect(hasMessageContent({ content: [part({ type: 'FILE', attachment: 'a2' })] })).toBe(true);
  });
});
