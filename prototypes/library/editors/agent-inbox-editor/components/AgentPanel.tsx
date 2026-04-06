import { useState, useRef, useEffect } from "react";
import type { DocumentDispatch } from "@powerhousedao/reactor-browser";
import type { AgentInboxAction } from "@powerhousedao/agent-manager/document-models/agent-inbox";
import {
  setAgentName,
  setAgentAddress,
  setAgentRole,
  setAgentDescription,
  setAgentAvatar,
} from "@powerhousedao/agent-manager/document-models/agent-inbox";

interface AgentPanelProps {
  agent: {
    name: string | null | undefined;
    role: string | null | undefined;
    ethAddress: string | null | undefined;
    description: string | null | undefined;
    avatar: string | null | undefined;
  };
  dispatch: DocumentDispatch<AgentInboxAction>;
  onCollapse?: () => void;
}

export function AgentPanel({ agent, dispatch, onCollapse }: AgentPanelProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [showAvatarPopover, setShowAvatarPopover] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingField]);

  const startEdit = (field: string, value: string | null | undefined) => {
    setEditingField(field);
    setTempValue(value || "");
  };

  const handleSave = (field: string) => {
    if (!tempValue.trim() && field !== "description") return; // Allow empty description

    // Don't submit if value hasn't changed
    const currentValue = agent[field as keyof typeof agent];
    if (tempValue === currentValue) {
      setEditingField(null);
      return;
    }

    switch (field) {
      case "name":
        dispatch(setAgentName({ name: tempValue }));
        break;
      case "role":
        dispatch(setAgentRole({ role: tempValue }));
        break;
      case "ethAddress":
        dispatch(setAgentAddress({ ethAddress: tempValue }));
        break;
      case "description":
        dispatch(setAgentDescription({ description: tempValue }));
        break;
    }
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === "Enter" && field !== "description") {
      e.preventDefault();
      handleSave(field);
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleAvatarSave = () => {
    if (avatarUrl.trim()) {
      // Don't submit if value hasn't changed
      if (avatarUrl === agent.avatar) {
        setShowAvatarPopover(false);
        setAvatarUrl("");
        return;
      }
      dispatch(setAgentAvatar({ avatar: avatarUrl }));
      setShowAvatarPopover(false);
      setAvatarUrl("");
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-start space-x-3">
        <div className="relative">
          <img
            src={
              agent.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${agent.name || "Agent"}`
            }
            alt={agent.name || "Agent"}
            className="w-12 h-12 rounded-full bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setAvatarUrl(agent.avatar || "");
              setShowAvatarPopover(true);
            }}
          />

          {/* Avatar URL Popover */}
          {showAvatarPopover && (
            <div className="absolute top-0 left-14 z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {avatarUrl && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview
                  </label>
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full bg-gray-100 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://api.dicebear.com/7.x/initials/svg?seed=Error`;
                    }}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowAvatarPopover(false);
                    setAvatarUrl("");
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAvatarSave}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Agent Name - Inline Edit */}
          {editingField === "name" ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => handleSave("name")}
              onKeyDown={(e) => handleKeyDown(e, "name")}
              className="text-lg font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          ) : (
            <h2
              className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:bg-gray-50 px-2 py-1 -ml-2 rounded"
              onClick={() => startEdit("name", agent.name)}
            >
              {agent.name || "Click to set name"}
            </h2>
          )}

          {/* Agent Role - Inline Edit */}
          {editingField === "role" ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => handleSave("role")}
              onKeyDown={(e) => handleKeyDown(e, "role")}
              className="text-sm text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          ) : (
            <p
              className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-0.5 -ml-2 rounded"
              onClick={() => startEdit("role", agent.role)}
            >
              {agent.role || "Click to set role"}
            </p>
          )}
        </div>

        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Collapse sidebar"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {/* ETH Address - Inline Edit */}
        <div className="flex items-center text-xs text-gray-500">
          <svg
            className="w-3 h-3 mr-1 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          {editingField === "ethAddress" ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => handleSave("ethAddress")}
              onKeyDown={(e) => handleKeyDown(e, "ethAddress")}
              className="font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
          ) : (
            <span
              className="font-mono truncate cursor-pointer hover:bg-gray-50 px-2 py-0.5 -ml-2 rounded flex-1"
              onClick={() => startEdit("ethAddress", agent.ethAddress)}
            >
              {agent.ethAddress || "Click to set ETH address"}
            </span>
          )}
        </div>

        {/* Description - Inline Edit */}
        {editingField === "description" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => handleSave("description")}
            onKeyDown={(e) => handleKeyDown(e, "description")}
            rows={2}
            className="w-full text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        ) : (
          <p
            className="text-xs text-gray-600 line-clamp-2 cursor-pointer hover:bg-gray-50 px-2 py-1 -mx-2 rounded"
            onClick={() => startEdit("description", agent.description)}
          >
            {agent.description || "Click to add description"}
          </p>
        )}
      </div>
    </div>
  );
}
