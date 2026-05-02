import type { RefObject } from 'react';
import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'chat-session-editor-dark-mode';

export function useDarkMode(rootRef: RefObject<HTMLDivElement | null>) {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (isDark) {
      el.classList.add('dark');
    } else {
      el.classList.remove('dark');
    }
  }, [isDark, rootRef]);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { isDark, toggle };
}
