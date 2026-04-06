import React, { useState, useEffect } from 'react';
import { Text, useInput } from 'ink';

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  focus?: boolean;
  showCursor?: boolean;
  /** When set, moves cursor to this offset. */
  cursorOffset?: number;
}

/**
 * Controlled text input with external cursor positioning.
 *
 * Based on ink-text-input but adds a `cursorOffset` prop so that
 * tab-completion and other programmatic value changes can move
 * the cursor to the correct position.
 *
 * Uses Ink's `<Text>` with `inverse` for cursor rendering instead of chalk,
 * so no extra dependencies are needed.
 */
export function TextInput({
  value: originalValue,
  placeholder = '',
  focus = true,
  showCursor = true,
  cursorOffset: externalCursorOffset,
  onChange,
  onSubmit,
}: TextInputProps) {
  const [internalOffset, setInternalOffset] = useState(
    (originalValue || '').length,
  );

  // Apply external cursor offset when provided
  useEffect(() => {
    if (externalCursorOffset !== undefined) {
      setInternalOffset(externalCursorOffset);
    }
  }, [externalCursorOffset]);

  // Clamp cursor when value shrinks
  useEffect(() => {
    const len = (originalValue || '').length;
    setInternalOffset((prev) => (prev > len ? len : prev));
  }, [originalValue]);

  const cursorOffset = internalOffset;

  useInput(
    (input, key) => {
      // Pass through keys handled by parent
      if (
        key.upArrow ||
        key.downArrow ||
        (key.ctrl && input === 'c') ||
        key.tab ||
        (key.shift && key.tab)
      ) {
        return;
      }

      if (key.return) {
        onSubmit?.(originalValue);
        return;
      }

      let nextOffset = cursorOffset;
      let nextValue = originalValue;

      if (key.home) {
        nextOffset = 0;
      } else if (key.end) {
        nextOffset = originalValue.length;
      } else if (key.leftArrow) {
        if (showCursor) nextOffset--;
      } else if (key.rightArrow) {
        if (showCursor) nextOffset++;
      } else if (key.backspace || key.delete) {
        if (cursorOffset > 0) {
          nextValue =
            originalValue.slice(0, cursorOffset - 1) +
            originalValue.slice(cursorOffset);
          nextOffset--;
        }
      } else {
        nextValue =
          originalValue.slice(0, cursorOffset) +
          input +
          originalValue.slice(cursorOffset);
        nextOffset += input.length;
      }

      // Clamp
      if (nextOffset < 0) nextOffset = 0;
      if (nextOffset > nextValue.length) nextOffset = nextValue.length;

      setInternalOffset(nextOffset);
      if (nextValue !== originalValue) {
        onChange(nextValue);
      }
    },
    { isActive: focus },
  );

  // Render value with cursor
  if (!showCursor || !focus) {
    if (originalValue.length > 0) {
      return <Text>{originalValue}</Text>;
    }
    return placeholder ? <Text dimColor>{placeholder}</Text> : <Text>{' '}</Text>;
  }

  // Empty value — show placeholder with cursor on first char
  if (originalValue.length === 0) {
    if (placeholder) {
      return (
        <Text>
          <Text inverse>{placeholder[0]}</Text>
          <Text dimColor>{placeholder.slice(1)}</Text>
        </Text>
      );
    }
    return <Text inverse>{' '}</Text>;
  }

  // Value with cursor
  const before = originalValue.slice(0, cursorOffset);
  const cursorChar = cursorOffset < originalValue.length
    ? originalValue[cursorOffset]
    : ' ';
  const after = cursorOffset < originalValue.length
    ? originalValue.slice(cursorOffset + 1)
    : '';

  return (
    <Text>
      {before}
      <Text inverse>{cursorChar}</Text>
      {after}
    </Text>
  );
}
