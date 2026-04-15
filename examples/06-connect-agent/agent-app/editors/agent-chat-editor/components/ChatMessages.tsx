import { useRef, useEffect, useMemo, Fragment } from "react";
import MarkdownIt from "markdown-it";
import type {
  ChatMessage,
  AgentInfo,
  Stakeholder,
} from "document-models/agent-chat";
import { getParticipantInfo, getActiveParticipants } from "./participants.js";

interface ChatMessagesProps {
  messages: ChatMessage[];
  agents: AgentInfo[];
  stakeholders: Stakeholder[];
  currentStakeholderId?: string;
}

/**
 * Highlight @mentions in an HTML string by wrapping them in spans.
 */
function highlightMentionsInHtml(
  html: string,
  agents: AgentInfo[],
  stakeholders: Stakeholder[],
): string {
  const participants = getActiveParticipants(agents, stakeholders);
  // Sort by name length descending to match longest names first
  const sorted = [...participants].sort(
    (a, b) => b.name.length - a.name.length,
  );
  let result = html;
  for (const p of sorted) {
    const escaped = p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(
      new RegExp(`@${escaped}`, "g"),
      `<span class="mention-highlight">@${p.name}</span>`,
    );
  }
  return result;
}

export function ChatMessages({
  messages,
  agents,
  stakeholders,
  currentStakeholderId,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const newMessagesRef = useRef<HTMLDivElement>(null);

  const md = useMemo(() => {
    const markdown = new MarkdownIt({
      html: false,
      linkify: true,
      typographer: true,
      breaks: true,
    });

    // Configure links to open in new tab
    const defaultRender =
      markdown.renderer.rules.link_open ||
      function (tokens, idx, options, _env, self) {
        return self.renderToken(tokens, idx, options);
      };

    markdown.renderer.rules.link_open = function (
      tokens,
      idx,
      options,
      env,
      self,
    ) {
      tokens[idx].attrSet("target", "_blank");
      tokens[idx].attrSet("rel", "noopener noreferrer");
      return defaultRender(tokens, idx, options, env, self);
    };

    return markdown;
  }, []);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  // Find first unread message for current stakeholder
  const firstUnreadIndex = currentStakeholderId
    ? messages.findIndex(
        (msg) =>
          msg.sender !== currentStakeholderId &&
          !msg.readBy?.includes(currentStakeholderId),
      )
    : -1;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        firstUnreadIndex !== -1 &&
        newMessagesRef.current &&
        scrollContainerRef.current
      ) {
        const dividerTop = newMessagesRef.current.offsetTop;
        const containerTop = scrollContainerRef.current.offsetTop;
        scrollContainerRef.current.scrollTop = dividerTop - containerTop;
      } else {
        scrollToBottom();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const renderMessageContent = (msg: ChatMessage, isFromAgent: boolean) => {
    switch (msg.type) {
      case "Text": {
        const chunks = msg.text ?? [];
        const useMarkdown =
          msg.format === "MarkDown" || msg.format === "Mixed";

        if (chunks.length <= 1) {
          const text = chunks[0] || "";
          if (useMarkdown) {
            const html = md.render(text);
            const highlighted = highlightMentionsInHtml(html, agents, stakeholders);
            return (
              <div
                className={`markdown-chat-message ${isFromAgent ? "" : "stakeholder"}`}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            );
          }
          const highlighted = highlightMentionsInHtml(
            text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
            agents, stakeholders,
          );
          return (
            <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: highlighted }} />
          );
        }

        // Multiple chunks — render each as a separate block with spacing
        return (
          <div className="space-y-2">
            {chunks.map((chunk, i) => {
              if (useMarkdown) {
                const html = md.render(chunk);
                const highlighted = highlightMentionsInHtml(html, agents, stakeholders);
                return (
                  <div
                    key={i}
                    className={`markdown-chat-message ${isFromAgent ? "" : "stakeholder"}`}
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                  />
                );
              }
              const highlighted = highlightMentionsInHtml(
                chunk.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
                agents, stakeholders,
              );
              return (
                <div key={i} className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: highlighted }} />
              );
            })}
          </div>
        );
      }
      case "ToolCall":
        return (
          <div className="font-mono text-xs">
            <div className="font-semibold mb-1">
              Tool Call: {msg.toolCall?.name}
            </div>
            <pre className="bg-black/10 rounded p-2 overflow-x-auto">
              {msg.toolCall?.argsJson}
            </pre>
          </div>
        );
      case "ToolResult":
        return (
          <div className="font-mono text-xs">
            <div className="font-semibold mb-1">
              {msg.toolResult?.isError ? "Tool Error" : "Tool Result"}:{" "}
              {msg.toolResult?.name}
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
      <div
        className="flex-1 overflow-y-auto bg-gray-50"
        ref={scrollContainerRef}
      >
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
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
      <div className="px-6 py-4 space-y-6 min-h-full flex flex-col justify-end">
        {messages.map((message, index) => {
          const sender = getParticipantInfo(
            message.sender,
            agents,
            stakeholders,
          );
          const isFromAgent = sender.isAgent;
          const messageTime = new Date(message.when).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          const isToolMessage =
            message.type === "ToolCall" || message.type === "ToolResult";

          // Read indicator for stakeholder messages
          const isFromCurrentStakeholder =
            currentStakeholderId && message.sender === currentStakeholderId;
          const isRead =
            isFromCurrentStakeholder &&
            message.readBy &&
            message.readBy.some((id) => id !== currentStakeholderId);

          return (
            <Fragment key={message.id}>
              {/* Unread messages divider */}
              {index === firstUnreadIndex && (
                <div ref={newMessagesRef} className="flex items-center my-4">
                  <div className="flex-1 border-t border-red-400"></div>
                  <span className="px-3 text-xs font-medium text-red-500">
                    NEW MESSAGES
                  </span>
                  <div className="flex-1 border-t border-red-400"></div>
                </div>
              )}
              <div
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
                  <div
                    className={`${isFromAgent ? "ml-1.5 mr-0" : "ml-0 mr-1.5"} ${isToolMessage ? "ml-10" : ""}`}
                  >
                    {!isToolMessage && (
                      <div className="flex items-baseline space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {sender.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {messageTime}
                        </span>
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
                      {renderMessageContent(message, isFromAgent)}
                    </div>
                    {/* Read/Delivered indicator for stakeholder messages */}
                    {isFromCurrentStakeholder && !isToolMessage && (
                      <div className="flex items-center justify-end mt-1">
                        {isRead ? (
                          <div className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4 text-blue-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-xs text-gray-500">Read</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-xs text-gray-400">
                              Delivered
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
