import { useRef, useState, useEffect } from "react";
import { generateId } from "document-model";
import type { AgentInfo, Stakeholder } from "document-models/agent-chat";
import { getActiveParticipants } from "./participants.js";
import { MentionInput, type MentionInputHandle } from "./MentionInput.js";

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
  const mentionRef = useRef<MentionInputHandle>(null);
  const [canSend, setCanSend] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);

  // Track whether the editor has content (for enabling/disabling Send button)
  // We observe DOM mutations on the mention-input-editor element
  useEffect(() => {
    const checkContent = () => {
      const editor = document.querySelector(".mention-input-editor");
      if (editor) {
        const hasText = !!editor.textContent?.trim();
        const hasPills = !!editor.querySelector(".mention-pill");
        setCanSend(hasText || hasPills);
      }
    };

    // Set up observer once the editor is mounted
    const timer = setTimeout(() => {
      const editor = document.querySelector(".mention-input-editor");
      if (editor) {
        observerRef.current = new MutationObserver(checkContent);
        observerRef.current.observe(editor, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        checkContent();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [stakeholder?.id]);

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

  // All active participants except the current sender
  const participants = getActiveParticipants(agents, stakeholders).filter(
    (p) => p.id !== stakeholder.id,
  );

  const handleSubmit = (text: string, mentionedIds: string[]) => {
    onSend({
      id: generateId(),
      sender: stakeholder.id,
      text,
      mentioned: mentionedIds,
      when: new Date().toISOString(),
    });
    setCanSend(false);
  };

  const handleSendClick = () => {
    mentionRef.current?.submit();
  };

  const avatarUrl =
    stakeholder.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${stakeholder.name}`;

  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
      <div className="flex items-start space-x-3">
        <button
          onClick={onSwitchStakeholder}
          className="flex-shrink-0 rounded-full hover:ring-2 hover:ring-blue-400 transition-all mt-1"
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
            <MentionInput
              ref={mentionRef}
              participants={participants}
              onSubmit={handleSubmit}
              placeholder="Type a message... Use @ to mention"
            />
          </div>
          <button
            onClick={handleSendClick}
            disabled={!canSend}
            style={{ height: 60 }}
            className={`px-5 text-sm font-medium rounded-lg transition-colors flex-shrink-0 ${
              canSend
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
