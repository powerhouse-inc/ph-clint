import { useState, useEffect, useRef } from "react";
import { generateId } from "document-model";
import type { Stakeholder } from "document-models/agent-chat";

interface StakeholderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  stakeholders: Stakeholder[];
  onSelect: (stakeholder: Stakeholder) => void;
  onAdd: (input: { id: string; name: string }) => void;
  onUpdate: (id: string, field: string, value: string) => void;
  onRemove: (id: string) => void;
}

/**
 * Stakeholder selection/creation modal.
 *
 * Adapted from the agent-inbox-editor NewChatModal stakeholder-selection view.
 * Shows a searchable list of existing stakeholders with radio selection,
 * inline edit, remove, and an add-new form with name/ETH address/avatar.
 */
export function StakeholderSelector({
  isOpen,
  onClose,
  stakeholders,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
}: StakeholderSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New stakeholder form
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newAvatar, setNewAvatar] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedId(null);
      setSearchQuery("");
      setIsAdding(false);
      setEditingId(null);
      setNewName("");
      setNewAddress("");
      setNewAvatar("");
    }
  }, [isOpen]);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeStakeholders = stakeholders.filter((s) => !s.removed);
  const filteredStakeholders = activeStakeholders.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.ethAddress &&
        s.ethAddress.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleAddStakeholder = () => {
    if (!newName.trim()) return;
    const id = generateId();
    onAdd({ id, name: newName.trim() });
    if (newAddress.trim()) onUpdate(id, "ethAddress", newAddress.trim());
    if (newAvatar.trim()) onUpdate(id, "avatar", newAvatar.trim());
    setNewName("");
    setNewAddress("");
    setNewAvatar("");
    setIsAdding(false);
    setSelectedId(id);
  };

  const handleConfirm = () => {
    const stakeholder = activeStakeholders.find((s) => s.id === selectedId);
    if (stakeholder) {
      onSelect(stakeholder);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
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
              Select Stakeholder
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
          <div className="space-y-4">
            {/* Search */}
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

            {/* Stakeholder list */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                Select a Stakeholder
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {filteredStakeholders.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    {activeStakeholders.length === 0
                      ? "No stakeholders yet — add one below"
                      : "No matches"}
                  </div>
                )}
                {filteredStakeholders.map((stakeholder) => (
                  <div
                    key={stakeholder.id}
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest("button")) {
                        setSelectedId(stakeholder.id);
                      }
                    }}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedId === stakeholder.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="stakeholder"
                        checked={selectedId === stakeholder.id}
                        onChange={() => setSelectedId(stakeholder.id)}
                        className="text-blue-600 pointer-events-none"
                      />
                      <img
                        src={
                          stakeholder.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${stakeholder.name}`
                        }
                        alt={stakeholder.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        {editingId === stakeholder.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              defaultValue={stakeholder.name}
                              onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v && v !== stakeholder.name)
                                  onUpdate(stakeholder.id, "name", v);
                                setEditingId(null);
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <input
                              type="text"
                              defaultValue={stakeholder.ethAddress || ""}
                              placeholder="ETH Address (optional)"
                              onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v !== (stakeholder.ethAddress || ""))
                                  onUpdate(stakeholder.id, "ethAddress", v);
                              }}
                              className="w-full px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="url"
                              defaultValue={stakeholder.avatar || ""}
                              placeholder="Avatar URL (optional)"
                              onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v !== (stakeholder.avatar || ""))
                                  onUpdate(stakeholder.id, "avatar", v);
                              }}
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

                      {/* Edit / Remove */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(
                              editingId === stakeholder.id
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
                            onRemove(stakeholder.id);
                            if (selectedId === stakeholder.id)
                              setSelectedId(null);
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

            {/* Add new stakeholder */}
            {isAdding ? (
              <div className="p-3 rounded-lg border border-blue-300 bg-blue-50">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Name (required)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="ETH Address (optional)"
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="url"
                    value={newAvatar}
                    onChange={(e) => setNewAvatar(e.target.value)}
                    placeholder="Avatar URL (optional)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewName("");
                        setNewAddress("");
                        setNewAvatar("");
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddStakeholder}
                      disabled={!newName.trim()}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedId}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
