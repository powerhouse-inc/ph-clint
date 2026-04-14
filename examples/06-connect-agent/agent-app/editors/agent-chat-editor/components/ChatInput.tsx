import { useState } from "react";
import { generateId } from "document-model";
import type { Stakeholder } from "document-models/agent-chat";

interface ChatInputProps {
  stakeholder: Stakeholder | undefined;
  onSend: (input: { id: string; sender: string; text: string; when: string }) => void;
  onSwitchStakeholder?: () => void;
}

export function ChatInput({ stakeholder, onSend, onSwitchStakeholder }: ChatInputProps) {
  const [message, setMessage] = useState("");

  if (!stakeholder || stakeholder.removed) {
    return (
      <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-center py-2 text-gray-500">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          <span className="text-sm font-medium">
            {!stakeholder ? "No stakeholder selected" : "This stakeholder has been removed"}
          </span>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    onSend({
      id: generateId(),
      sender: stakeholder.id,
      text: trimmed,
      when: new Date().toISOString(),
    });
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const avatarUrl = stakeholder.avatar
    || `https://api.dicebear.com/7.x/initials/svg?seed=${stakeholder.name}`;

  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
      <div className="flex items-center space-x-3">
        <button
          onClick={onSwitchStakeholder}
          className="flex-shrink-0 rounded-full hover:ring-2 hover:ring-blue-400 transition-all"
          title={`Chatting as ${stakeholder.name} — click to switch`}
        >
          <img
            src={avatarUrl}
            alt={stakeholder.name}
            className="w-12 h-12 rounded-full"
          />
        </button>
        <div className="flex-1 flex items-stretch space-x-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            style={{ minHeight: "60px" }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className={`px-5 py-3 text-sm font-medium rounded-lg transition-colors self-stretch ${
              message.trim()
                ? "bg-blue-700 text-white hover:bg-blue-800"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Send
          </button>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 text-right">
        <span>Press Ctrl+Enter to send</span>
      </div>
    </div>
  );
}
