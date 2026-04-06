import { useState, useEffect, useRef } from "react";
import { generateId } from "document-model/core";
import type { DocumentDispatch } from "@powerhousedao/reactor-browser";
import type {
  AgentInboxAction,
  Stakeholder as DocumentStakeholder,
} from "@powerhousedao/agent-manager/document-models/agent-inbox";
import {
  addStakeholder,
  setStakeholderName,
  setStakeholderAddress,
  setStakeholderAvatar,
  removeStakeholder,
  createThread,
} from "@powerhousedao/agent-manager/document-models/agent-inbox";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  stakeholders: DocumentStakeholder[];
  dispatch: DocumentDispatch<AgentInboxAction>;
  onThreadCreated?: (threadId: string) => void;
}

type ViewMode = "stakeholder-selection" | "chat-creation";

export function NewChatModal({
  isOpen,
  onClose,
  stakeholders,
  dispatch,
  onThreadCreated,
}: NewChatModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("stakeholder-selection");
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingStakeholder, setIsAddingStakeholder] = useState(false);
  const [editingStakeholderId, setEditingStakeholderId] = useState<
    string | null
  >(null);

  // New stakeholder form
  const [newStakeholderName, setNewStakeholderName] = useState("");
  const [newStakeholderAddress, setNewStakeholderAddress] = useState("");
  const [newStakeholderAvatar, setNewStakeholderAvatar] = useState("");

  // Chat creation form
  const [topic, setTopic] = useState("");
  const [initialMessage, setInitialMessage] = useState("");

  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const topicInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setViewMode("stakeholder-selection");
      setSelectedStakeholderId(null);
      setSearchQuery("");
      setIsAddingStakeholder(false);
      setEditingStakeholderId(null);
      setNewStakeholderName("");
      setNewStakeholderAddress("");
      setNewStakeholderAvatar("");
      setTopic("");
      setInitialMessage("");
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      if (viewMode === "stakeholder-selection" && searchInputRef.current) {
        searchInputRef.current.focus();
      } else if (viewMode === "chat-creation" && topicInputRef.current) {
        topicInputRef.current.focus();
      }
    }
  }, [isOpen, viewMode]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter active stakeholders
  const activeStakeholders = stakeholders.filter((s) => !s.removed);
  const filteredStakeholders = activeStakeholders.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.ethAddress &&
        s.ethAddress.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const selectedStakeholder = activeStakeholders.find(
    (s) => s.id === selectedStakeholderId,
  );

  const handleAddStakeholder = () => {
    if (!newStakeholderName.trim()) return;

    const stakeholderId = generateId();
    dispatch(
      addStakeholder({
        id: stakeholderId,
        name: newStakeholderName.trim(),
        ethAddress: newStakeholderAddress.trim() || undefined,
        avatar: newStakeholderAvatar.trim() || undefined,
      }),
    );

    // Reset form and select the new stakeholder
    setNewStakeholderName("");
    setNewStakeholderAddress("");
    setNewStakeholderAvatar("");
    setIsAddingStakeholder(false);
    setSelectedStakeholderId(stakeholderId);
  };

  const handleUpdateStakeholder = (
    stakeholder: DocumentStakeholder,
    field: string,
    value: string,
  ) => {
    const trimmedValue = value.trim();

    switch (field) {
      case "name":
        // Only dispatch if name has changed and is not empty
        if (trimmedValue && trimmedValue !== stakeholder.name) {
          dispatch(
            setStakeholderName({ id: stakeholder.id, name: trimmedValue }),
          );
        }
        break;
      // Only dispatch if address has changed
      case "ethAddress": {
        const newAddress = trimmedValue || undefined;
        const currentAddress = stakeholder.ethAddress || undefined;
        if (newAddress !== currentAddress) {
          dispatch(
            setStakeholderAddress({
              id: stakeholder.id,
              ethAddress: newAddress,
            }),
          );
        }
        break;
      }
      // Only dispatch if avatar URL has changed
      case "avatar": {
        const newAvatar = trimmedValue || undefined;
        const currentAvatar = stakeholder.avatar || undefined;
        if (newAvatar !== currentAvatar) {
          dispatch(
            setStakeholderAvatar({
              id: stakeholder.id,
              avatar: newAvatar,
            }),
          );
        }
        break;
      }
    }
    setEditingStakeholderId(null);
  };

  const handleRemoveStakeholder = (stakeholderId: string) => {
    dispatch(removeStakeholder({ id: stakeholderId }));
    if (selectedStakeholderId === stakeholderId) {
      setSelectedStakeholderId(null);
    }
  };

  const handleCreateThread = () => {
    if (!selectedStakeholderId || !initialMessage.trim()) return;

    const threadId = generateId();
    const messageId = generateId();

    dispatch(
      createThread({
        id: threadId,
        stakeholder: selectedStakeholderId,
        topic: topic.trim() || undefined,
        initialMessage: {
          id: messageId,
          flow: "Incoming",
          when: new Date().toISOString(),
          content: initialMessage.trim(),
        },
      }),
    );

    onThreadCreated?.(threadId);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {viewMode === "stakeholder-selection"
                ? "New Chat"
                : "Create Thread"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {viewMode === "stakeholder-selection" ? (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stakeholders..."
                  className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Stakeholder List */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Select a Stakeholder
                </h3>

                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {filteredStakeholders.map((stakeholder) => (
                    <div
                      key={stakeholder.id}
                      onClick={(e) => {
                        // Only select if not clicking on edit/delete buttons
                        const target = e.target as HTMLElement;
                        if (!target.closest("button")) {
                          setSelectedStakeholderId(stakeholder.id);
                        }
                      }}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedStakeholderId === stakeholder.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Radio/Selection */}
                        <input
                          type="radio"
                          name="stakeholder"
                          checked={selectedStakeholderId === stakeholder.id}
                          onChange={() =>
                            setSelectedStakeholderId(stakeholder.id)
                          }
                          className="text-blue-600 pointer-events-none"
                        />

                        {/* Avatar */}
                        <img
                          src={
                            stakeholder.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${stakeholder.name}`
                          }
                          alt={stakeholder.name}
                          className="w-10 h-10 rounded-full"
                        />

                        {/* Details */}
                        <div className="flex-1">
                          {editingStakeholderId === stakeholder.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                defaultValue={stakeholder.name}
                                onBlur={(e) =>
                                  handleUpdateStakeholder(
                                    stakeholder,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <input
                                type="text"
                                defaultValue={stakeholder.ethAddress || ""}
                                placeholder="ETH Address (optional)"
                                onBlur={(e) =>
                                  handleUpdateStakeholder(
                                    stakeholder,
                                    "ethAddress",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="url"
                                defaultValue={stakeholder.avatar || ""}
                                placeholder="Avatar URL (optional)"
                                onBlur={(e) =>
                                  handleUpdateStakeholder(
                                    stakeholder,
                                    "avatar",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="font-medium text-gray-900">
                                {stakeholder.name}
                              </div>
                              {stakeholder.ethAddress && (
                                <div className="text-xs text-gray-500 font-mono truncate">
                                  {stakeholder.ethAddress}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStakeholderId(
                                editingStakeholderId === stakeholder.id
                                  ? null
                                  : stakeholder.id,
                              );
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit"
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
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveStakeholder(stakeholder.id);
                            }}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Remove"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Stakeholder - Outside the list */}
              {isAddingStakeholder ? (
                <div className="p-3 rounded-lg border border-blue-300 bg-blue-50">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newStakeholderName}
                      onChange={(e) => setNewStakeholderName(e.target.value)}
                      placeholder="Name (required)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={newStakeholderAddress}
                      onChange={(e) => setNewStakeholderAddress(e.target.value)}
                      placeholder="ETH Address (optional)"
                      className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="url"
                      value={newStakeholderAvatar}
                      onChange={(e) => setNewStakeholderAvatar(e.target.value)}
                      placeholder="Avatar URL (optional)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setIsAddingStakeholder(false);
                          setNewStakeholderName("");
                          setNewStakeholderAddress("");
                          setNewStakeholderAvatar("");
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddStakeholder}
                        disabled={!newStakeholderName.trim()}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingStakeholder(true)}
                  className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Add New Stakeholder</span>
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Stakeholder Display */}
              {selectedStakeholder && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={
                      selectedStakeholder.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${selectedStakeholder.name}`
                    }
                    alt={selectedStakeholder.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {selectedStakeholder.name}
                    </div>
                    {selectedStakeholder.ethAddress && (
                      <div className="text-xs text-gray-500 font-mono">
                        {selectedStakeholder.ethAddress}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setViewMode("stakeholder-selection")}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Topic Input */}
              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Topic (optional)
                </label>
                <input
                  ref={topicInputRef}
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter conversation topic..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Initial Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Initial Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={6}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This message will appear as coming from the stakeholder
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <div>
              {viewMode === "chat-creation" && (
                <button
                  onClick={() => setViewMode("stakeholder-selection")}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {viewMode === "stakeholder-selection" ? (
                <button
                  onClick={() => setViewMode("chat-creation")}
                  disabled={!selectedStakeholderId}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleCreateThread}
                  disabled={!initialMessage.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create New Chat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
