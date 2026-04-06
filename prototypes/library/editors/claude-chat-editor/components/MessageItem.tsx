import type {
  Message,
  Agent,
} from "@powerhousedao/agent-manager/document-models/claude-chat";

interface MessageItemProps {
  message: Message;
  agent?: Agent;
  username: string;
}

export function MessageItem({ message, agent, username }: MessageItemProps) {
  const isUserMessage = !message.agent;
  const senderName = isUserMessage ? username : agent?.name || "Unknown Agent";

  return (
    <div
      className={`flex ${isUserMessage ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[70%] rounded-lg p-4 ${
          isUserMessage ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div
          className={`text-xs font-medium mb-1 ${
            isUserMessage ? "text-blue-100" : "text-gray-600"
          }`}
        >
          {senderName}
        </div>
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    </div>
  );
}
