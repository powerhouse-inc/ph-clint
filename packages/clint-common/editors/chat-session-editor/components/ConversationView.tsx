import type { Message as MessageType, ContentPart } from 'document-models/chat-session';
import { Conversation, ConversationContent, ConversationScrollButton, ConversationEmptyState } from './ai-elements/conversation.js';
import { MessageBubble } from './MessageBubble.js';
import { MessageSquareIcon } from 'lucide-react';
import { useMemo } from 'react';

interface ConversationViewProps {
  messages: MessageType[];
}

export function ConversationView({ messages }: ConversationViewProps) {
  const toolResultMap = useMemo(() => {
    const map = new Map<string, ContentPart>();
    for (const msg of messages) {
      if (msg.role !== 'TOOL') continue;
      for (const part of msg.content) {
        if (part.toolCallId) {
          map.set(part.toolCallId, part);
        }
      }
    }
    return map;
  }, [messages]);

  const visibleMessages = useMemo(() => {
    const ids = new Set<string>();
    for (const msg of messages) {
      if (msg.role !== 'ASSISTANT') continue;
      for (const part of msg.content) {
        if (part.type === 'TOOL_CALL' && part.toolCallId) {
          ids.add(part.toolCallId);
        }
      }
    }

    const visible = messages.filter((msg) => {
      if (msg.role !== 'TOOL') return true;
      return !msg.content.every((part) => part.toolCallId && ids.has(part.toolCallId));
    });

    return visible;
  }, [messages]);

  return (
    <Conversation className="flex-1">
      <ConversationContent className="mx-auto max-w-[1100px]">
        {visibleMessages.length === 0 ? (
          <ConversationEmptyState title="No messages yet" description="Type a message below to start the conversation" icon={<MessageSquareIcon className="size-8" />} />
        ) : (
          visibleMessages.map((message) => <MessageBubble key={message.id} message={message} toolResultMap={toolResultMap} />)
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
