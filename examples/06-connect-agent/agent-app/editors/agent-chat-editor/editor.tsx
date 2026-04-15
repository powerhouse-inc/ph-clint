import { useState, useEffect } from "react";
import { DocumentToolbar } from "@powerhousedao/design-system/connect/index";
import {
  useSelectedAgentChatDocument,
  actions,
} from "document-models/agent-chat";
import type { Stakeholder } from "document-models/agent-chat";
import { ChatHeader } from "./components/ChatHeader.js";
import { ChatMessages } from "./components/ChatMessages.js";
import { ChatInput } from "./components/ChatInput.js";
import { StakeholderSelector } from "./components/StakeholderSelector.js";

export default function Editor() {
  const [document, dispatch] = useSelectedAgentChatDocument();
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<
    string | null
  >(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  if (!document || !dispatch) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No document selected
      </div>
    );
  }

  const state = document.state.global;
  const { topic, agents, stakeholders, messages } = state;

  // Auto-open selector when no stakeholders exist
  const hasActiveStakeholders = stakeholders.some((s) => !s.removed);
  useEffect(() => {
    if (!hasActiveStakeholders && !isSelectorOpen) {
      setIsSelectorOpen(true);
    }
  }, [hasActiveStakeholders]);

  // Resolve the active sender: explicit selection, or first non-removed stakeholder
  const activeSender = selectedStakeholderId
    ? stakeholders.find((s) => s.id === selectedStakeholderId && !s.removed)
    : stakeholders.find((s) => !s.removed);

  // Mark unread messages as read by the current stakeholder
  useEffect(() => {
    if (!activeSender) return;
    const unread = messages.filter(
      (msg) =>
        msg.sender !== activeSender.id &&
        !msg.readBy?.includes(activeSender.id),
    );
    for (const msg of unread) {
      dispatch(
        actions.markAsRead({ messageId: msg.id, readBy: activeSender.id }),
      );
    }
  }, [messages.length, activeSender?.id]);

  const handleSetTopic = (newTopic: string) => {
    dispatch(actions.setTopic({ topic: newTopic }));
  };

  const handleSendMessage = (input: {
    id: string;
    sender: string;
    text: string;
    mentioned: string[];
    when: string;
  }) => {
    dispatch(
      actions.sendText({
        id: input.id,
        sender: input.sender,
        text: input.text,
        mentioned: input.mentioned,
        when: input.when,
        format: "MarkDown",
      }),
    );
  };

  const handleSelectStakeholder = (stakeholder: Stakeholder) => {
    setSelectedStakeholderId(stakeholder.id);
  };

  const handleAddStakeholder = (input: { id: string; name: string }) => {
    dispatch(actions.addStakeholder({ id: input.id, name: input.name }));
  };

  const handleUpdateStakeholder = (
    id: string,
    field: string,
    value: string,
  ) => {
    switch (field) {
      case "name":
        dispatch(actions.setStakeholderName({ id, name: value }));
        break;
      case "ethAddress":
        dispatch(actions.setStakeholderEthAddress({ id, ethAddress: value }));
        break;
      case "avatar":
        dispatch(actions.setStakeholderAvatar({ id, avatar: value }));
        break;
    }
  };

  const handleRemoveStakeholder = (id: string) => {
    dispatch(actions.removeStakeholder({ id }));
    if (selectedStakeholderId === id) setSelectedStakeholderId(null);
  };

  return (
    <div className="flex flex-col pt-4 px-4 w-full h-[calc(100vh-1rem)] mx-auto max-w-[1600px]">
      <style>{`
/* Markdown chat message styling - Agent messages (blue background) */
        .markdown-chat-message {
          color: white;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .markdown-chat-message p {
          margin-bottom: 0.75rem;
          color: white;
        }
        .markdown-chat-message p:last-child {
          margin-bottom: 0;
        }
        .markdown-chat-message strong {
          color: white;
          font-weight: 600;
        }
        .markdown-chat-message em {
          color: white;
          font-style: italic;
        }
        .markdown-chat-message a {
          color: #93c5fd;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .markdown-chat-message a:hover {
          color: #dbeafe;
        }
        .markdown-chat-message code {
          background-color: rgba(30, 58, 138, 0.5);
          color: #dbeafe;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.85em;
        }
        .markdown-chat-message pre {
          background-color: rgba(30, 58, 138, 0.3);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 0.375rem;
          padding: 0.75rem;
          margin: 0.75rem 0;
          overflow-x: auto;
        }
        .markdown-chat-message pre code {
          background-color: transparent;
          padding: 0;
        }
        .markdown-chat-message ul,
        .markdown-chat-message ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
          list-style: revert;
        }
        .markdown-chat-message ul {
          list-style-type: disc;
        }
        .markdown-chat-message ol {
          list-style-type: decimal;
        }
        .markdown-chat-message li {
          margin-bottom: 0.25rem;
          display: list-item;
        }
        .markdown-chat-message ul ul {
          list-style-type: circle;
        }
        .markdown-chat-message ul ul ul {
          list-style-type: square;
        }
        .markdown-chat-message blockquote {
          border-left: 3px solid rgba(147, 197, 253, 0.5);
          padding-left: 1rem;
          margin: 0.75rem 0;
          color: rgba(255, 255, 255, 0.9);
        }
        .markdown-chat-message h1,
        .markdown-chat-message h2,
        .markdown-chat-message h3,
        .markdown-chat-message h4 {
          color: white;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .markdown-chat-message h1 { font-size: 1.5rem; }
        .markdown-chat-message h2 { font-size: 1.25rem; }
        .markdown-chat-message h3 { font-size: 1.125rem; }
        .markdown-chat-message h4 { font-size: 1rem; }

        /* Stakeholder message markdown styling */
        .markdown-chat-message.stakeholder {
          color: #111827;
        }
        .markdown-chat-message.stakeholder p {
          color: #111827;
        }
        .markdown-chat-message.stakeholder strong {
          color: #111827;
        }
        .markdown-chat-message.stakeholder em {
          color: #111827;
        }
        .markdown-chat-message.stakeholder a {
          color: #2563eb;
        }
        .markdown-chat-message.stakeholder a:hover {
          color: #1d4ed8;
        }
        .markdown-chat-message.stakeholder code {
          background-color: #f3f4f6;
          color: #1f2937;
        }
        .markdown-chat-message.stakeholder pre {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
        }
        .markdown-chat-message.stakeholder blockquote {
          border-left-color: #9ca3af;
          color: #4b5563;
        }
        .markdown-chat-message.stakeholder h1,
        .markdown-chat-message.stakeholder h2,
        .markdown-chat-message.stakeholder h3,
        .markdown-chat-message.stakeholder h4 {
          color: #111827;
        }

        /* ── MentionInput ── */
        .mention-input-wrapper {
          position: relative;
        }
        .mention-input-editor {
          min-height: 60px;
          max-height: 150px;
          overflow-y: auto;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          line-height: 1.5;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          outline: none;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .mention-input-editor:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        .mention-input-editor[data-empty="true"]:not(:focus)::before {
          content: attr(aria-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .mention-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: rgba(59,130,246,0.15);
          color: #1d4ed8;
          font-weight: 600;
          font-size: 0.8125rem;
          padding: 1px 6px 1px 2px;
          border-radius: 4px;
          vertical-align: baseline;
          user-select: all;
          cursor: default;
        }
        .mention-pill-avatar {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }
        .mention-dropdown {
          position: absolute;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          max-height: 220px;
          overflow-y: auto;
          z-index: 100;
          min-width: 220px;
          padding: 4px 0;
        }
        .mention-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .mention-dropdown-item.active {
          background: #eff6ff;
        }
        .mention-dropdown-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .mention-dropdown-badge {
          font-size: 0.6875rem;
          padding: 1px 6px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 4px;
          margin-left: auto;
        }

        /* Mention highlighting — agent bubbles (white on blue) */
        .mention-highlight {
          font-weight: 700;
          color: #ffffff;
          background: rgba(255,255,255,0.2);
          padding: 1px 4px;
          border-radius: 3px;
        }
        /* Mention highlighting — stakeholder bubbles (blue on white) */
        .markdown-chat-message.stakeholder .mention-highlight,
        .whitespace-pre-wrap .mention-highlight {
          color: #1d4ed8;
          background: rgba(29,78,216,0.1);
        }
      `}</style>
      <div className="pb-6 flex-0 flex items-center gap-4">
        <DocumentToolbar />
      </div>

      <div className="overflow-x-hidden flex-1 flex flex-col border border-gray-200 shadow-md relative">
        <ChatHeader topic={topic} agents={agents} onSetTopic={handleSetTopic} />

        <ChatMessages
          messages={messages}
          agents={agents}
          stakeholders={stakeholders}
          currentStakeholderId={activeSender?.id}
        />

        {activeSender ? (
          <ChatInput
            stakeholder={activeSender}
            agents={agents}
            stakeholders={stakeholders}
            onSend={handleSendMessage}
            onSwitchStakeholder={() => setIsSelectorOpen(true)}
          />
        ) : (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="text-center text-gray-500 text-sm">
              Join as a stakeholder to start chatting
            </div>
            <div className="flex justify-center mt-2">
              <button
                onClick={() => setIsSelectorOpen(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Select or Create Stakeholder</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <StakeholderSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        stakeholders={stakeholders}
        onSelect={handleSelectStakeholder}
        onAdd={handleAddStakeholder}
        onUpdate={handleUpdateStakeholder}
        onRemove={handleRemoveStakeholder}
      />
    </div>
  );
}
