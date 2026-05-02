import { DocumentToolbar } from '@powerhousedao/design-system/connect';
import { useSelectedChatSessionDocument } from 'document-models/chat-session';
import { useState, useEffect, useCallback, useRef, type DragEvent } from 'react';
import { AgentInfoHeader } from './components/AgentInfoHeader.js';
import { ChatInputBar } from './components/ChatInputBar.js';
import { ConversationView } from './components/ConversationView.js';
import { SessionStatusBar } from './components/SessionStatusBar.js';
import { TestPane } from './components/test-pane/TestPane.js';
import { PanelRightOpenIcon, PanelRightCloseIcon, SunIcon, MoonIcon, PaperclipIcon } from 'lucide-react';
import { cn } from './lib/utils.js';
import { useDarkMode } from './hooks/useDarkMode.js';

export default function Editor() {
  const [document, dispatch] = useSelectedChatSessionDocument();
  const [showTestPane, setShowTestPane] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { isDark, toggle: toggleDarkMode } = useDarkMode(rootRef);

  const state = document.state.global;

  const toggleTestPane = useCallback(() => {
    setShowTestPane((prev) => !prev);
  }, []);

  // Ref holding the PromptInput's add-files function, set by ChatInputBar.
  const addFilesRef = useRef<((files: FileList) => void) | null>(null);

  // Drag & drop: intercept file drags so Connect's DropZone doesn't block them.
  const [isDragOver, setIsDragOver] = useState(false);
  const dragDepthRef = useRef(0);

  const onEditorDragOver = useCallback((e: DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);
  const onEditorDragEnter = useCallback((e: DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.stopPropagation();
      dragDepthRef.current += 1;
      if (dragDepthRef.current === 1) setIsDragOver(true);
    }
  }, []);
  const onEditorDragLeave = useCallback((e: DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.stopPropagation();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDragOver(false);
    }
  }, []);
  const onEditorDrop = useCallback((e: DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFilesRef.current?.(e.dataTransfer.files);
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 't' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        toggleTestPane();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTestPane]);

  return (
    <div ref={rootRef} className="absolute inset-0 flex flex-col overflow-hidden bg-background text-foreground" onDragOver={onEditorDragOver} onDrop={onEditorDrop} onDragEnter={onEditorDragEnter} onDragLeave={onEditorDragLeave}>
      <DocumentToolbar />

      <div className="relative flex flex-1 overflow-hidden">
        {isDragOver && (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/60 bg-background/90 px-10 py-8 shadow-lg">
              <PaperclipIcon className="size-10 text-primary" />
              <p className="text-base font-medium text-foreground">Drop files to attach</p>
              <p className="text-sm text-muted-foreground">Files will be added to your message</p>
            </div>
          </div>
        )}
        <div className="flex flex-1 flex-col min-w-0">
          <AgentInfoHeader agent={state.agent} />
          <ConversationView messages={state.messages} />
          <ChatInputBar dispatch={dispatch} disabled={state.status !== 'ACTIVE'} addFilesRef={addFilesRef} />
          <SessionStatusBar status={state.status} startedAt={state.startedAt} endedAt={state.endedAt} usage={state.usage} messageCount={state.messages.length}>
            <button type="button" onClick={toggleDarkMode} className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80" title="Toggle Dark Mode">
              {isDark ? <SunIcon className="size-3.5" /> : <MoonIcon className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={toggleTestPane}
              className={cn('flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors', showTestPane ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}
              title="Toggle Test Pane (Ctrl+Shift+T)"
            >
              {showTestPane ? <PanelRightCloseIcon className="size-3.5" /> : <PanelRightOpenIcon className="size-3.5" />}
              Test
            </button>
          </SessionStatusBar>
        </div>

        {showTestPane && (
          <div className="w-[380px] shrink-0 overflow-hidden">
            <TestPane dispatch={dispatch} />
          </div>
        )}
      </div>
    </div>
  );
}
