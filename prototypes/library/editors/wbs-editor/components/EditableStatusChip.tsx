import React, { useState, useCallback, useRef, useEffect } from "react";
// @ts-ignore - react-dom types issue
import * as ReactDOM from "react-dom";
import StatusChip, { STATUS_COLORS, STATUS_LABELS } from "./StatusChip.js";

interface EditableStatusChipProps {
  row: {
    status: string;
    id: string;
  };
  column: {
    id: string;
  };
  onAction?: (action: any) => void;
  onStatusChange?: (statusData: any) => void;
}

// Status options ordered as per document model specification
const STATUS_OPTIONS = [
  // Waiting statuses
  { id: "TODO", label: "To Do" },
  { id: "BLOCKED", label: "Blocked" },
  // Active statuses
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "DELEGATED", label: "Delegated" },
  { id: "IN_REVIEW", label: "In Review" },
  // Finished statuses
  { id: "COMPLETED", label: "Completed" },
  { id: "WONT_DO", label: "Won't Do" },
];

export default function EditableStatusChip({
  row,
  column,
  onAction,
  onStatusChange,
}: EditableStatusChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentStatus = row.status as keyof typeof STATUS_COLORS;
  const currentOption =
    STATUS_OPTIONS.find((opt) => opt.id === currentStatus) || STATUS_OPTIONS[0];
  const currentColors = STATUS_COLORS[currentStatus] || STATUS_COLORS.TODO;
  const currentLabel = STATUS_LABELS[currentStatus] || currentStatus;

  const handleOptionSelect = useCallback(
    (selectedId: string) => {
      const selectedOption = STATUS_OPTIONS.find(
        (opt) => opt.id === selectedId,
      );

      if (selectedOption) {
        // Try both approaches for maximum compatibility
        if (onAction) {
          onAction({
            action: "status-change",
            data: {
              value: selectedOption.id,
              label: selectedOption.label,
              column: column.id,
              row: row.id,
            },
          });
        }

        if (onStatusChange) {
          onStatusChange({
            data: {
              value: selectedOption.id,
              label: selectedOption.label,
              column: column.id,
              row: row.id,
            },
          });
        }
      }

      setIsEditing(false);
      setIsOpen(false);
    },
    [onAction, column, row, onStatusChange],
  );

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    // Delay opening to ensure edit mode is established
    setTimeout(() => {
      setIsOpen(true);
      buttonRef.current?.focus();
    }, 0);
  }, []);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 2,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both the container and the portal dropdown
      const target = event.target as Node;
      const dropdown = document.getElementById(
        `dropdown-${row.id}-${column.id}`,
      );

      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdown || !dropdown.contains(target))
      ) {
        setIsEditing(false);
        setIsOpen(false);
      }
    };

    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [isEditing, row.id, column.id]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsEditing(false);
        setIsOpen(false);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(
            STATUS_OPTIONS.findIndex((opt) => opt.id === currentOption.id),
          );
        } else if (highlightedIndex >= 0) {
          handleOptionSelect(STATUS_OPTIONS[highlightedIndex].id);
        }
      } else if (isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          if (prev === -1) {
            return STATUS_OPTIONS.findIndex(
              (opt) => opt.id === currentOption.id,
            );
          }
          if (e.key === "ArrowDown") {
            return (prev + 1) % STATUS_OPTIONS.length;
          } else {
            return (prev - 1 + STATUS_OPTIONS.length) % STATUS_OPTIONS.length;
          }
        });
      }
    },
    [isOpen, highlightedIndex, currentOption.id, handleOptionSelect],
  );

  if (isEditing) {
    return (
      <>
        <div
          ref={containerRef}
          className="flex items-center justify-center h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            ref={buttonRef}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium min-w-[120px] focus:outline-none transition-all"
            style={{
              backgroundColor: currentColors.bg,
              color: currentColors.text,
              boxShadow: isOpen
                ? `0 0 0 2px ${currentColors.text}40`
                : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
              if (!isOpen) {
                setHighlightedIndex(
                  STATUS_OPTIONS.findIndex(
                    (opt) => opt.id === currentOption.id,
                  ),
                );
              }
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: currentColors.dot }}
            />
            {currentLabel}
          </button>
        </div>

        {isOpen &&
          ReactDOM.createPortal(
            <div
              id={`dropdown-${row.id}-${column.id}`}
              className="fixed bg-white border border-gray-300 rounded shadow-lg min-w-[120px]"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${Math.max(dropdownPosition.width, 120)}px`,
                zIndex: 9999,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {STATUS_OPTIONS.map((option, index) => {
                const optionColors =
                  STATUS_COLORS[option.id as keyof typeof STATUS_COLORS] ||
                  STATUS_COLORS.TODO;
                return (
                  <div
                    key={option.id}
                    className={`flex items-center gap-1.5 w-full text-left text-xs px-3 py-2 cursor-pointer ${
                      index === highlightedIndex ? "brightness-110" : ""
                    } hover:brightness-110 transition-all`}
                    style={{
                      backgroundColor: optionColors.bg,
                      color: optionColors.text,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptionSelect(option.id);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: optionColors.dot }}
                    />
                    {option.label}
                  </div>
                );
              })}
            </div>,
            document.body,
          )}
      </>
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="h-full"
      style={{ userSelect: "none" }}
    >
      <StatusChip row={row} />
    </div>
  );
}
