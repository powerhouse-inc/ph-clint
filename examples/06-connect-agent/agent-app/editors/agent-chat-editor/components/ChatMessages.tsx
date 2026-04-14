import { useRef, useEffect, Fragment } from "react";
import type { ChatMessage, AgentInfo, Stakeholder } from "document-models/agent-chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
  agents: AgentInfo[];
  stakeholders: Stakeholder[];
}

export function ChatMessages({ messages, agents, stakeholders }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const agentIds = new Set(agents.map((a) => a.id));

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const getSenderInfo = (senderId: string): { name: string; avatar: string; isAgent: boolean } => {
    const agent = agents.find((a) => a.id === senderId);
    if (agent) {
      return {
        name: agent.name || "Agent",
        avatar: agent.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${agent.name || "Agent"}`,
        isAgent: true,
      };
    }
    const stakeholder = stakeholders.find((s) => s.id === senderId);
    if (stakeholder) {
      return {
        name: stakeholder.name,
        avatar: stakeholder.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${stakeholder.name}`,
        isAgent: false,
      };
    }
    return { name: senderId, avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${senderId}`, isAgent: false };
  };

  const renderMessageContent = (msg: ChatMessage) => {
    switch (msg.type) {
      case "Text":
        return (
          <div className="whitespace-pre-wrap break-words">
            {msg.text?.join("") || ""}
          </div>
        );
      case "ToolCall":
        return (
          <div className="font-mono text-xs">
            <div className="font-semibold mb-1">Tool Call: {msg.toolCall?.name}</div>
            <pre className="bg-black/10 rounded p-2 overflow-x-auto">
              {msg.toolCall?.argsJson}
            </pre>
          </div>
        );
      case "ToolResult":
        return (
          <div className="font-mono text-xs">
            <div className="font-semibold mb-1">
              {msg.toolResult?.isError ? "Tool Error" : "Tool Result"}: {msg.toolResult?.name}
            </div>
            <pre className="bg-black/10 rounded p-2 overflow-x-auto max-h-40">
              {msg.toolResult?.result}
            </pre>
          </div>
        );
      case "Error":
        return (
          <div className="text-red-200">
            <span className="font-semibold">Error: </span>
            {msg.error}
          </div>
        );
      default:
        return null;
    }
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50" ref={scrollContainerRef}>
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start the conversation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50" ref={scrollContainerRef}>
      <div className="px-6 py-4 space-y-6">
        {messages.map((message) => {
          const sender = getSenderInfo(message.sender);
          const isFromAgent = sender.isAgent;
          const messageTime = new Date(message.when).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          const isToolMessage = message.type === "ToolCall" || message.type === "ToolResult";

          return (
            <div
              key={message.id}
              className={`flex ${isFromAgent ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`flex ${isFromAgent ? "flex-row" : "flex-row-reverse"} items-start space-x-1.5 max-w-[75%]`}
              >
                {!isToolMessage && (
                  <img
                    src={sender.avatar}
                    alt={sender.name}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                <div className={`${isFromAgent ? "ml-1.5 mr-0" : "ml-0 mr-1.5"} ${isToolMessage ? "ml-10" : ""}`}>
                  {!isToolMessage && (
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{sender.name}</span>
                      <span className="text-xs text-gray-500">{messageTime}</span>
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.type === "Error"
                        ? "bg-red-600 text-white"
                        : isToolMessage
                          ? "bg-gray-200 text-gray-800 border border-gray-300"
                          : isFromAgent
                            ? "bg-blue-700 text-white"
                            : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    {renderMessageContent(message)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
