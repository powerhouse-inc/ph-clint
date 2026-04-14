import { useState, useEffect } from "react";
import {
  DocumentToolbar,
} from "@powerhousedao/design-system/connect/index";
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
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string | null>(null);
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

  const handleSetTopic = (newTopic: string) => {
    dispatch(actions.setTopic({ topic: newTopic }));
  };

  const handleSendMessage = (input: {
    id: string;
    sender: string;
    text: string;
    when: string;
  }) => {
    dispatch(
      actions.sendText({
        id: input.id,
        sender: input.sender,
        text: input.text,
        when: input.when,
        format: "Text",
      }),
    );
  };

  const handleSelectStakeholder = (stakeholder: Stakeholder) => {
    setSelectedStakeholderId(stakeholder.id);
  };

  const handleAddStakeholder = (input: { id: string; name: string }) => {
    dispatch(actions.addStakeholder({ id: input.id, name: input.name }));
  };

  const handleUpdateStakeholder = (id: string, field: string, value: string) => {
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
      <div className="pb-6 flex-0">
        <DocumentToolbar />
      </div>

      <div className="overflow-hidden flex-1 flex flex-col border border-gray-200 shadow-md">
        <ChatHeader
          topic={topic}
          agents={agents}
          onSetTopic={handleSetTopic}
        />

        <ChatMessages
          messages={messages}
          agents={agents}
          stakeholders={stakeholders}
        />

        {activeSender ? (
          <ChatInput
            stakeholder={activeSender}
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
