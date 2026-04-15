import { useState } from "react";
import { generateId } from "document-model";
import Mentions from "@rc-component/mentions";
import type { AgentInfo, Stakeholder } from "document-models/agent-chat";
import { getActiveParticipants } from "./participants.js";

interface ChatInputProps {
  stakeholder: Stakeholder | undefined;
  agents: AgentInfo[];
  stakeholders: Stakeholder[];
  onSend: (input: {
    id: string;
    sender: string;
    text: string;
    mentioned: string[];
    when: string;
  }) => void;
  onSwitchStakeholder?: () => void;
}

export function ChatInput({
  stakeholder,
  agents,
  stakeholders,
  onSend,
  onSwitchStakeholder,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [mentionedIds, setMentionedIds] = useState<Set<string>>(new Set());

  if (!stakeholder || stakeholder.removed) {
    return (
      <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-center py-2 text-gray-500">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          <span className="text-sm font-medium">
            {!stakeholder
              ? "No stakeholder selected"
              : "This stakeholder has been removed"}
          </span>
        </div>
      </div>
    );
  }

  // Build mention options: all active participants except the current sender
  const participants = getActiveParticipants(agents, stakeholders).filter(
    (p) => p.id !== stakeholder.id,
  );

  const mentionOptions = participants.map((p) => ({
    value: p.name,
    key: p.id,
    label: (
      <div className="flex items-center gap-2">
        <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full" />
        <span className="text-sm">{p.name}</span>
        {p.isAgent && (
          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
            agent
          </span>
        )}
      </div>
    ),
  }));

  const handleChange = (text: string) => {
    setValue(text);
    // Prune mentions whose @name no longer appears in the text
    setMentionedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        const participant = participants.find((p) => p.id === id);
        if (participant && text.includes(`@${participant.name}`)) {
          next.add(id);
        }
      }
      return next;
    });
  };

  const handleSelect = (option: { value?: string; key?: string }) => {
    if (option.key) {
      setMentionedIds((prev) => new Set(prev).add(option.key!));
    }
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    onSend({
      id: generateId(),
      sender: stakeholder.id,
      text: trimmed,
      mentioned: [...mentionedIds],
      when: new Date().toISOString(),
    });
    setValue("");
    setMentionedIds(new Set());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const avatarUrl =
    stakeholder.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${stakeholder.name}`;

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
          <div className="flex-1">
            <Mentions
              value={value}
              onChange={handleChange}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
              prefix="@"
              split=""
              options={mentionOptions}
              rows={3}
              autoSize={{ minRows: 2, maxRows: 5 }}
              placeholder="Type a message... Use @ to mention"
              placement="top"
              notFoundContent={null}
              classNames={{ textarea: "chat-mentions-textarea" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!value.trim()}
            className={`px-5 py-3 text-sm font-medium rounded-lg transition-colors self-stretch ${
              value.trim()
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
