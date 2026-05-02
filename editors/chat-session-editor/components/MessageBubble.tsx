import type { Message as MessageType, ContentPart } from 'document-models/chat-session';
import { Message, MessageContent } from './ai-elements/message.js';
import { ContentPartRenderer } from './ContentPartRenderer.js';
import { BotIcon, UserIcon, TerminalIcon, ShieldIcon } from 'lucide-react';

interface MessageBubbleProps {
  message: MessageType;
  toolResultMap: Map<string, ContentPart>;
}

export function MessageBubble({ message, toolResultMap }: MessageBubbleProps) {
  switch (message.role) {
    case 'SYSTEM':
      return <SystemMessageBanner message={message} />;
    case 'USER':
      return <UserMessage message={message} />;
    case 'ASSISTANT':
      return <AssistantMessage message={message} toolResultMap={toolResultMap} />;
    case 'TOOL':
      return <ToolMessage message={message} />;
    default:
      return null;
  }
}

function SystemMessageBanner({ message }: { message: MessageType }) {
  const text = message.content[0]?.text;
  if (!text) return null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <ShieldIcon className="mt-0.5 size-3.5 shrink-0" />
        <div className="min-w-0 whitespace-pre-wrap break-words">{text}</div>
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: MessageType }) {
  return (
    <Message from="user">
      <div className="flex items-start justify-end gap-2">
        <MessageContent>
          {message.content.map((part) => (
            <ContentPartRenderer key={part.id} part={part} />
          ))}
        </MessageContent>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserIcon className="size-3.5" />
        </div>
      </div>
    </Message>
  );
}

function AssistantMessage({ message, toolResultMap }: { message: MessageType; toolResultMap: Map<string, ContentPart> }) {
  return (
    <Message from="assistant">
      <div className="flex items-start gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <BotIcon className="size-3.5" />
        </div>
        <MessageContent>
          {message.content.map((part) => {
            const linkedResult = part.type === 'TOOL_CALL' && part.toolCallId ? toolResultMap.get(part.toolCallId) : undefined;
            return <ContentPartRenderer key={part.id} part={part} linkedResult={linkedResult} />;
          })}
        </MessageContent>
      </div>
      {message.usage && (
        <div className="ml-9 text-xs text-muted-foreground">
          {message.usage.totalTokens != null && <span>{message.usage.totalTokens} tokens</span>}
          {message.usage.promptTokens != null && (
            <span className="ml-2">
              (prompt: {message.usage.promptTokens}, completion: {message.usage.completionTokens ?? 0})
            </span>
          )}
        </div>
      )}
    </Message>
  );
}

function ToolMessage({ message }: { message: MessageType }) {
  return (
    <Message from="assistant">
      <div className="flex items-start gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
          <TerminalIcon className="size-3.5" />
        </div>
        <MessageContent>
          {message.content.map((part) => (
            <ContentPartRenderer key={part.id} part={part} />
          ))}
        </MessageContent>
      </div>
    </Message>
  );
}
