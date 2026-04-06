import React, { useState, useEffect, useRef } from 'react';
import { Text, useInput, useStdin } from 'ink';

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  focus?: boolean;
  showCursor?: boolean;
  /** When set, moves cursor to this offset. */
  cursorOffset?: number;
  /** Inline ghost text shown after the cursor (e.g. completion preview). */
  suggestion?: string;
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
  suggestion = '',
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

  // Track physical Delete key (\x1b[3~) via raw stdin since Ink maps both
  // Backspace (\x7f) and Delete (\x1b[3~) to key.delete
  const { stdin } = useStdin();
  const isForwardDelete = useRef(false);
  useEffect(() => {
    const onData = (data: Buffer) => {
      const s = data.toString();
      isForwardDelete.current = s === '\x1b[3~';
    };
    stdin.on('data', onData);
    return () => { stdin.off('data', onData); };
  }, [stdin]);

  useInput(
    (input, key) => {
      // Ignore terminal focus reporting sequences
      if (input === '[I' || input === '[O' || ((key.escape) && (input === 'I' || input === 'O'))) {
        return;
      }

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
        if (showCursor) {
          if (key.ctrl) {
            // Jump to previous word boundary
            let i = cursorOffset - 1;
            while (i > 0 && originalValue[i - 1] === ' ') i--;
            while (i > 0 && originalValue[i - 1] !== ' ') i--;
            nextOffset = i;
          } else {
            nextOffset--;
          }
        }
      } else if (key.rightArrow) {
        if (showCursor) {
          if (key.ctrl) {
            // Jump to next word boundary
            let i = cursorOffset;
            while (i < originalValue.length && originalValue[i] !== ' ') i++;
            while (i < originalValue.length && originalValue[i] === ' ') i++;
            nextOffset = i;
          } else {
            nextOffset++;
          }
        }
      } else if ((key.delete || key.backspace) && isForwardDelete.current) {
        // Physical Delete key (\x1b[3~): forward delete
        if (cursorOffset < originalValue.length) {
          nextValue =
            originalValue.slice(0, cursorOffset) +
            originalValue.slice(cursorOffset + 1);
        }
      } else if (key.delete || key.backspace) {
        // Physical Backspace (\x7f) or Ctrl+H (\b): backward delete
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
  const atEnd = cursorOffset >= originalValue.length;

  // Ghost text: show suggestion suffix when cursor is at end
  if (atEnd && suggestion) {
    const ghost = suggestion.slice(originalValue.length);
    if (ghost.length > 0) {
      return (
        <Text>
          {before}
          <Text dimColor inverse>{ghost[0]}</Text>
          <Text dimColor>{ghost.slice(1)}</Text>
        </Text>
      );
    }
  }

  const cursorChar = !atEnd ? originalValue[cursorOffset] : ' ';
  const after = !atEnd ? originalValue.slice(cursorOffset + 1) : '';

  return (
    <Text>
      {before}
      <Text inverse>{cursorChar}</Text>
      {after}
    </Text>
  );
}
