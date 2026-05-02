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

  return (
    <Conversation className="flex-1">
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState title="No messages yet" description="Use the Test Pane to dispatch operations and build a conversation" icon={<MessageSquareIcon className="size-8" />} />
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} toolResultMap={toolResultMap} />)
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
