import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSelectedWorkBreakdownStructureDocument } from "@powerhousedao/agent-manager/document-models/work-breakdown-structure";
import MarkdownIt from "markdown-it";
import {
  updateDescription,
  updateInstructions,
  clearInstructions,
  addNote,
  removeNote,
  markAsDraft,
  markAsReady,
  markTodo,
  markInProgress,
  markCompleted,
  markWontDo,
  reportBlocked,
  delegateGoal,
  reportOnGoal,
} from "@powerhousedao/agent-manager/document-models/work-breakdown-structure";
import { generateId } from "document-model/core";
import { findGoalInTree } from "../utils/treeTransform.js";
import { Tooltip } from "./Tooltip.js";
import { SingleClickStatusChip } from "./SingleClickStatusChip.js";
import { BlockedStatusPopup } from "./BlockedStatusPopup.js";
import { DelegationPopup } from "./DelegationPopup.js";
import { ReportProgressPopup } from "./ReportProgressPopup.js";

interface GoalEditSidebarProps {
  goalId: string;
  onClose: () => void;
}

export function GoalEditSidebar({ goalId, onClose }: GoalEditSidebarProps) {
  const [document, dispatch] = useSelectedWorkBreakdownStructureDocument();
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const notesListRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
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
      function (tokens, idx, options, env, self) {
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
  const [descriptionValue, setDescriptionValue] = useState("");
  const [instructionsValue, setInstructionsValue] = useState<string>("");
  const [workTypeValue, setWorkTypeValue] = useState<
    "SKILL" | "SCENARIO" | "TASK" | ""
  >("");
  const [workIdValue, setWorkIdValue] = useState<string>("");
  const [contextJSONValue, setContextJSONValue] = useState<string>("");
  const [newNoteValue, setNewNoteValue] = useState("");

  // Scroll to bottom of notes list when adding a note
  useEffect(() => {
    if (addingNote && notesListRef.current) {
      notesListRef.current.scrollTop = notesListRef.current.scrollHeight;
    }
  }, [addingNote]);
  const [blockedPopup, setBlockedPopup] = useState<{
    isOpen: boolean;
    goalId: string;
  }>({
    isOpen: false,
    goalId: "",
  });
  const [delegationPopup, setDelegationPopup] = useState<{
    isOpen: boolean;
    goalId: string;
  }>({
    isOpen: false,
    goalId: "",
  });
  const [reportProgressPopup, setReportProgressPopup] = useState<{
    isOpen: boolean;
    goalId: string;
  }>({
    isOpen: false,
    goalId: "",
  });

  if (!document) return null;

  // Find the goal in the document
  const goals = document.state.global.goals || [];
  const goal = goals.find((g) => g.id === goalId);

  // Sync values when goal changes
  useEffect(() => {
    if (goal) {
      setDescriptionValue(goal.description);
      if (goal.instructions) {
        if (typeof goal.instructions === "string") {
          setInstructionsValue(goal.instructions);
          setWorkTypeValue("");
          setWorkIdValue("");
          setContextJSONValue("");
        } else {
          setInstructionsValue(goal.instructions.comments || "");
          setWorkTypeValue(goal.instructions.workType || "");
          setWorkIdValue(goal.instructions.workId || "");
          setContextJSONValue(
            goal.instructions.context ? goal.instructions.context.data : "",
          );
        }
      } else {
        setInstructionsValue("");
        setWorkTypeValue("");
        setWorkIdValue("");
        setContextJSONValue("");
      }
    }
  }, [goal?.description, goal?.instructions]);

  if (!goal) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Goal Not Found
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-gray-500">
          The selected goal could not be found.
        </p>
      </div>
    );
  }

  const handleDescriptionBlur = () => {
    const newDescription = descriptionValue.trim();
    if (newDescription && newDescription !== goal.description) {
      dispatch(
        updateDescription({ goalId: goal.id, description: newDescription }),
      );
    }
    setEditingDescription(false);
  };

  const handleDescriptionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur(); // Trigger onBlur to save
    } else if (e.key === "Escape") {
      setDescriptionValue(goal.description); // Reset to original
      setEditingDescription(false);
    }
  };

  const handleInstructionsSave = () => {
    const hasContent =
      instructionsValue.trim() || workIdValue.trim() || contextJSONValue.trim();

    if (hasContent) {
      // Validate JSON if provided
      if (contextJSONValue.trim()) {
        try {
          JSON.parse(contextJSONValue.trim());
        } catch (e) {
          alert("Invalid JSON in context field. Please fix it before saving.");
          return;
        }
      }

      dispatch(
        updateInstructions({
          goalId: goal.id,
          instructions: {
            comments: instructionsValue.trim(),
            workType: workTypeValue || undefined,
            workId: workIdValue.trim() || undefined,
            contextJSON: contextJSONValue.trim() || undefined,
          },
        }),
      );
    } else {
      dispatch(clearInstructions({ goalId: goal.id }));
    }
    setEditingInstructions(false);
  };

  const handleInstructionsCancel = () => {
    // Reset to original values
    if (goal.instructions) {
      if (typeof goal.instructions === "string") {
        setInstructionsValue(goal.instructions);
        setWorkTypeValue("");
        setWorkIdValue("");
        setContextJSONValue("");
      } else {
        setInstructionsValue(goal.instructions.comments || "");
        setWorkTypeValue(goal.instructions.workType || "");
        setWorkIdValue(goal.instructions.workId || "");
        setContextJSONValue(
          goal.instructions.context ? goal.instructions.context.data : "",
        );
      }
    } else {
      setInstructionsValue("");
      setWorkTypeValue("");
      setWorkIdValue("");
      setContextJSONValue("");
    }
    setEditingInstructions(false);
  };

  const handleToggleDraft = () => {
    if (goal.isDraft) {
      dispatch(markAsReady({ goalId: goal.id }));
    } else {
      dispatch(markAsDraft({ goalId: goal.id }));
    }
  };

  // Handle status changes from the dropdown
  const handleStatusChange = useCallback(
    (actionData: any) => {
      if (!dispatch) return;

      const { value } = actionData.data || actionData;

      if (value === "BLOCKED") {
        // Show popup for blocked status
        setBlockedPopup({ isOpen: true, goalId: goal.id });
      } else {
        // Handle other status changes directly
        switch (value) {
          case "TODO":
            dispatch(markTodo({ id: goal.id }));
            break;
          case "IN_PROGRESS":
            dispatch(markInProgress({ id: goal.id }));
            break;
          case "COMPLETED":
            dispatch(markCompleted({ id: goal.id }));
            break;
          case "WONT_DO":
            dispatch(markWontDo({ id: goal.id }));
            break;
          case "DELEGATED":
            // Show delegation popup (pre-fill assignee if currently IN_REVIEW)
            setDelegationPopup({ isOpen: true, goalId: goal.id });
            break;
          case "IN_REVIEW":
            // Transition to IN_REVIEW requires a report
            // Show the report progress popup with the move to review option pre-selected
            setReportProgressPopup({ isOpen: true, goalId: goal.id });
            break;
          default:
            console.warn("Unknown status:", value);
        }
      }
    },
    [dispatch, goal?.id],
  );

  // Handle blocked status popup
  const handleBlockedSubmit = useCallback(
    (note: string, author?: string) => {
      if (!dispatch) return;
      dispatch(
        reportBlocked({
          id: blockedPopup.goalId,
          type: "MISSING_INFORMATION",
          comment: note,
        }),
      );
    },
    [dispatch, blockedPopup.goalId],
  );

  const handleBlockedClose = useCallback(() => {
    setBlockedPopup({ isOpen: false, goalId: "" });
  }, []);

  // Handle delegation popup
  const handleDelegationSubmit = useCallback(
    (assignee: string) => {
      if (!dispatch) return;
      dispatch(
        delegateGoal({
          id: delegationPopup.goalId,
          assignee,
        }),
      );
    },
    [dispatch, delegationPopup.goalId],
  );

  const handleDelegationClose = useCallback(() => {
    setDelegationPopup({ isOpen: false, goalId: "" });
  }, []);

  // Handle report progress popup
  const handleReportProgressSubmit = useCallback(
    (note: string, moveToReview: boolean, author?: string) => {
      if (!dispatch) return;
      dispatch(
        reportOnGoal({
          id: reportProgressPopup.goalId,
          note: {
            id: generateId(),
            note,
            author: author || undefined,
          },
          moveInReview: moveToReview,
        }),
      );
    },
    [dispatch, reportProgressPopup.goalId],
  );

  const handleReportProgressClose = useCallback(() => {
    setReportProgressPopup({ isOpen: false, goalId: "" });
  }, []);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(goal.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error("Failed to copy ID:", error);
    }
  };

  const handleAddNote = (noteText: string) => {
    if (noteText.trim()) {
      dispatch(
        addNote({
          goalId: goal.id,
          noteId: generateId(),
          note: noteText.trim(),
          author: document?.state.global.owner || undefined,
        }),
      );
      setNewNoteValue("");
      setAddingNote(false);
    }
  };

  const handleRemoveNote = (noteId: string) => {
    dispatch(removeNote({ goalId: goal.id, noteId }));
  };

  const handleNewNoteSubmit = () => {
    const noteText = newNoteValue.trim();
    if (noteText) {
      handleAddNote(noteText);
    }
  };

  const handleNewNoteKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleNewNoteSubmit();
    } else if (e.key === "Escape") {
      setNewNoteValue("");
      setAddingNote(false);
      e.currentTarget.blur(); // Unfocus the textarea
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with close button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">Goal Details</h3>
          <Tooltip
            content={copied ? "Copied!" : `Goal ID: ${goal.id} • Click to copy`}
          >
            <span
              className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 transition-colors duration-200"
              onClick={handleCopyId}
            >
              {copied ? "✓" : "⧉"}
            </span>
          </Tooltip>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          title="Close goal editor"
        >
          ×
        </button>
      </div>

      {/* Inline Editable Description Title */}
      <div>
        {editingDescription ? (
          <input
            type="text"
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            onBlur={handleDescriptionBlur}
            onKeyDown={handleDescriptionKeyDown}
            onFocus={(e) => e.target.select()}
            className="w-full text-xl font-semibold text-gray-800 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 pb-1"
            placeholder="Enter goal description"
            autoFocus
          />
        ) : (
          <h2
            className="text-xl font-semibold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors duration-200 pb-1 border-b-2 border-transparent hover:border-gray-300"
            onClick={() => setEditingDescription(true)}
            title="Click to edit description"
          >
            {goal.description || "Untitled Goal"}
          </h2>
        )}
      </div>

      {/* Status and Assignee Row */}
      <div className="flex items-center gap-2">
        <SingleClickStatusChip
          goal={goal}
          onStatusChange={handleStatusChange}
        />
        {(goal.status === "DELEGATED" || goal.status === "IN_REVIEW") &&
          goal.assignee && (
            <>
              <span className="text-gray-400">→</span>
              <span className="text-sm font-medium text-gray-700">
                {goal.assignee}
              </span>
            </>
          )}
      </div>

      {/* Draft Status */}
      <div>
        <h4 className="text-base font-semibold text-gray-700 mb-2">Status</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base text-gray-600">
              {goal.isDraft ? "📝 Draft" : "✅ Ready"}
            </span>
          </div>
          <button
            onClick={handleToggleDraft}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300"
          >
            Mark as {goal.isDraft ? "Ready" : "Draft"}
          </button>
        </div>
      </div>

      {/* Other information */}
      <div className="space-y-4">
        {/* Instructions Section */}
        <div>
          <h4 className="text-base font-semibold text-gray-700 mb-2">
            Instructions
          </h4>
          {editingInstructions ? (
            <div className="space-y-3 border-2 border-blue-500 bg-white p-3 rounded">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Comments
                </label>
                <textarea
                  value={instructionsValue}
                  onChange={(e) => setInstructionsValue(e.target.value)}
                  className="w-full text-sm text-gray-600 bg-white border border-gray-300 focus:border-blue-500 focus:outline-none p-2 rounded resize-vertical min-h-[60px]"
                  placeholder="Enter instructions for this goal"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Work Type
                </label>
                <select
                  value={workTypeValue}
                  onChange={(e) =>
                    setWorkTypeValue(
                      e.target.value as "SKILL" | "SCENARIO" | "TASK" | "",
                    )
                  }
                  className="w-full text-sm text-gray-600 bg-white border border-gray-300 focus:border-blue-500 focus:outline-none p-2 rounded"
                >
                  <option value="">None</option>
                  <option value="SKILL">Skill</option>
                  <option value="SCENARIO">Scenario</option>
                  <option value="TASK">Task</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Work ID
                </label>
                <input
                  type="text"
                  value={workIdValue}
                  onChange={(e) => setWorkIdValue(e.target.value)}
                  className="w-full text-sm text-gray-600 bg-white border border-gray-300 focus:border-blue-500 focus:outline-none p-2 rounded"
                  placeholder="e.g., skill, skill.S01, skill.S01.001"
                />
                {workIdValue && (
                  <p className="text-xs text-gray-500 mt-1">
                    Format: skill (no dots), skill.XY (scenario), skill.XY.123
                    (task)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Context (JSON)
                </label>
                <textarea
                  value={contextJSONValue}
                  onChange={(e) => setContextJSONValue(e.target.value)}
                  className={`w-full text-sm text-gray-600 bg-white border focus:outline-none p-2 rounded resize-vertical min-h-[60px] font-mono ${
                    (contextJSONValue.trim() &&
                      (() => {
                        try {
                          JSON.parse(contextJSONValue.trim());
                          return "border-green-400 focus:border-green-500";
                        } catch {
                          return "border-red-400 focus:border-red-500";
                        }
                      })()) ||
                    "border-gray-300 focus:border-blue-500"
                  }`}
                  placeholder='e.g., {"type": "party", "theme": "superhero"}'
                />
                {contextJSONValue.trim() && (
                  <div className="mt-1">
                    {(() => {
                      try {
                        JSON.parse(contextJSONValue.trim());
                        return (
                          <p className="text-xs text-green-600">✓ Valid JSON</p>
                        );
                      } catch (e) {
                        return (
                          <p className="text-xs text-red-600">
                            ✗ Invalid JSON:{" "}
                            {e instanceof Error ? e.message : "Invalid format"}
                          </p>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={handleInstructionsCancel}
                  className="px-3 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInstructionsSave}
                  className="px-3 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors duration-200"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-sm text-gray-600 p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors duration-200 border-2 border-transparent hover:border-gray-300"
              onClick={() => setEditingInstructions(true)}
              title="Click to edit instructions"
            >
              {goal.instructions ? (
                <div className="space-y-2">
                  {typeof goal.instructions === "string" ? (
                    <div className="whitespace-pre-wrap">
                      {goal.instructions}
                    </div>
                  ) : (
                    <>
                      {goal.instructions.comments && (
                        <div className="whitespace-pre-wrap">
                          {goal.instructions.comments}
                        </div>
                      )}
                      {(goal.instructions.workType ||
                        goal.instructions.workId) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {goal.instructions.workType && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              Type: {goal.instructions.workType}
                            </span>
                          )}
                          {goal.instructions.workId && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                              ID: {goal.instructions.workId}
                            </span>
                          )}
                        </div>
                      )}
                      {goal.instructions.context && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            Context:
                          </div>
                          <div className="text-xs text-gray-700 font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                            <pre className="whitespace-pre-wrap">
                              {(() => {
                                try {
                                  // Try to parse and prettify if it's JSON
                                  const parsed = JSON.parse(
                                    goal.instructions.context.data,
                                  );
                                  return JSON.stringify(parsed, null, 2);
                                } catch {
                                  // If not valid JSON, display as-is
                                  return goal.instructions.context.data;
                                }
                              })()}
                            </pre>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">
                  No instructions set. Click to add instructions.
                </div>
              )}

              {/* Outcome Data Section */}
              {goal.outcome && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    Outcome:
                  </div>
                  <div className="text-xs text-gray-700 font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                    {goal.outcome.format === "JSON" ? (
                      <pre className="whitespace-pre-wrap">
                        {(() => {
                          try {
                            // Try to parse and prettify if it's JSON
                            const parsed = JSON.parse(goal.outcome.data);
                            return JSON.stringify(parsed, null, 2);
                          } catch {
                            // If not valid JSON, display as-is
                            return goal.outcome.data;
                          }
                        })()}
                      </pre>
                    ) : (
                      <div className="whitespace-pre-wrap font-sans">
                        {goal.outcome.data}
                      </div>
                    )}
                    {goal.outcome.format !== "TEXT" && (
                      <div className="mt-1 text-xs text-gray-500 font-sans">
                        Format: {goal.outcome.format}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {goal.dependencies.length > 0 && (
          <div>
            <h4 className="text-base font-semibold text-gray-700 mb-2">
              Dependencies
            </h4>
            <div className="space-y-1">
              {goal.dependencies.map((depId) => (
                <div
                  key={depId}
                  className="text-xs text-gray-500 font-mono bg-gray-100 p-1 rounded"
                >
                  {depId}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div>
          <h4 className="text-base font-semibold text-gray-700 mb-2">Notes</h4>
          <div ref={notesListRef} className="space-y-2 mb-3">
            {goal.notes.length === 0 ? (
              <div className="text-sm text-gray-400 p-3 bg-gray-50 rounded text-center">
                No notes yet. Add your first note below.
              </div>
            ) : (
              goal.notes.map((note) => (
                <div
                  key={note.id}
                  className="text-sm text-gray-600 p-3 bg-white border border-gray-200 rounded group hover:border-gray-300 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div
                        className="markdown-note"
                        dangerouslySetInnerHTML={{
                          __html: md.render(note.note),
                        }}
                      />
                      {note.author && (
                        <div className="text-xs text-gray-400 mt-2">
                          — {note.author}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveNote(note.id)}
                      className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Remove note"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="relative">
            <textarea
              value={newNoteValue}
              onChange={(e) => setNewNoteValue(e.target.value)}
              onFocus={() => setAddingNote(true)}
              onKeyDown={handleNewNoteKeyDown}
              className="w-full text-sm text-gray-600 bg-white border border-gray-300 focus:border-blue-500 focus:outline-none p-2 rounded resize-vertical min-h-[60px]"
              placeholder="Add a note..."
            />
            {addingNote && (
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-400">
                  Ctrl+Enter to save, Escape to cancel
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAddingNote(false);
                      setNewNoteValue("");
                    }}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNewNoteSubmit}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                    disabled={!newNoteValue.trim()}
                  >
                    Add Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BlockedStatusPopup
        isOpen={blockedPopup.isOpen}
        onClose={handleBlockedClose}
        onSubmit={handleBlockedSubmit}
        goalId={blockedPopup.goalId}
      />

      <DelegationPopup
        isOpen={delegationPopup.isOpen}
        onClose={handleDelegationClose}
        onSubmit={handleDelegationSubmit}
        goalId={delegationPopup.goalId}
        defaultAssignee={
          goal.status === "IN_REVIEW" && goal.assignee
            ? goal.assignee
            : undefined
        }
      />

      <ReportProgressPopup
        isOpen={reportProgressPopup.isOpen}
        onClose={handleReportProgressClose}
        onSubmit={handleReportProgressSubmit}
        goalId={reportProgressPopup.goalId}
        goalDescription={goal.description}
        currentAssignee={goal.assignee || undefined}
      />
    </div>
  );
}
