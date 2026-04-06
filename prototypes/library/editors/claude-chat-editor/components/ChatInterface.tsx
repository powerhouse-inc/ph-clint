import { useState, useRef, useEffect } from "react";
import type { FormEventHandler } from "react";
import { generateId } from "document-model/core";
import { useSelectedClaudeChatDocument } from "@powerhousedao/agent-manager/document-models/claude-chat";
import {
  addUserMessage,
  addAgentMessage,
  setSelectedAgent,
} from "@powerhousedao/agent-manager/document-models/claude-chat";
import { MessageItem } from "./MessageItem.js";
import { createClaudeService } from "../services/ClaudeService.js";

export function ChatInterface() {
  const [document, dispatch] = useSelectedClaudeChatDocument();
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [document?.state.global.messages]);

  if (!document) return null;

  const { messages, agents, username, selectedAgent } = document.state.global;

  const handleSendMessage: FormEventHandler<HTMLFormElement> = (e) => {
    void (async () => {
      e.preventDefault();

      if (!inputMessage.trim() || isLoadingResponse) return;

      const userMessageContent = inputMessage.trim();
      setInputMessage("");
      setApiError(null);

      // Add user message
      dispatch(
        addUserMessage({
          id: generateId(),
          content: userMessageContent,
        }),
      );

      // If an agent is selected, get real Claude response
      if (selectedAgent) {
        const selectedAgentObj = agents.find((a) => a.id === selectedAgent);

        if (selectedAgentObj) {
          setIsLoadingResponse(true);

          try {
            const claudeService = createClaudeService(selectedAgentObj);
            const response = await claudeService.sendMessage(
              selectedAgentObj,
              messages,
              userMessageContent,
            );

            dispatch(
              addAgentMessage({
                id: generateId(),
                agent: selectedAgent,
                content: response.content,
              }),
            );
          } catch (error: unknown) {
            console.error("Failed to get Claude response:", error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to get response from Claude";
            setApiError(errorMessage);

            // Add an error message to the chat
            dispatch(
              addAgentMessage({
                id: generateId(),
                agent: selectedAgent,
                content: `❌ Error: ${errorMessage}`,
              }),
            );
          } finally {
            setIsLoadingResponse(false);
          }
        }
      }
    })();
  };

  return (
    <div className="bg-white rounded-b-lg shadow-sm border-l border-r border-b border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
          {agents.length > 0 && (
            <select
              value={selectedAgent || ""}
              onChange={(e) =>
                dispatch(setSelectedAgent({ agentId: e.target.value || null }))
              }
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No agent (user only)</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const agent = message.agent
                ? agents.find((a) => a.id === message.agent)
                : undefined;
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  agent={agent}
                  username={username || "User"}
                />
              );
            })}
            {isLoadingResponse && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[70%] rounded-lg p-4 bg-gray-100 text-gray-900">
                  <div className="text-xs font-medium mb-1 text-gray-600">
                    {agents.find((a) => a.id === selectedAgent)?.name ||
                      "Agent"}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200"
      >
        {apiError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {apiError}
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              selectedAgent
                ? isLoadingResponse
                  ? "Waiting for response..."
                  : "Type a message..."
                : "Type a message (select an agent to get responses)..."
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            disabled={isLoadingResponse}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoadingResponse}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoadingResponse ? "..." : "Send"}
          </button>
        </div>
        {selectedAgent && !isLoadingResponse && (
          <p className="text-xs text-gray-500 mt-2">
            Messages will be sent to{" "}
            {agents.find((a) => a.id === selectedAgent)?.name} using Claude API
          </p>
        )}
      </form>
    </div>
  );
}
