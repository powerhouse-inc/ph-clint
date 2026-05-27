import type { IAttachmentService } from '@powerhousedao/reactor-attachments';
import type { DocumentDispatch } from '@powerhousedao/reactor-browser';
import type { ChatSessionAction, ChatSessionDocument } from 'document-models/chat-session';
import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { MoonIcon, PanelRightCloseIcon, PanelRightOpenIcon, PaperclipIcon, SunIcon } from 'lucide-react';
import { AgentInfoHeader } from './components/AgentInfoHeader.js';
import { ChatInputBar } from './components/ChatInputBar.js';
import { AttachmentServiceProvider } from './components/ContentPartRenderer.js';
import { ConversationView } from './components/ConversationView.js';
import { SessionStatusBar } from './components/SessionStatusBar.js';
import { TestPane } from './components/test-pane/TestPane.js';
import { useDarkMode } from './hooks/useDarkMode.js';
import { cn } from './lib/utils.js';

export type ChatSessionProps = {
  document: ChatSessionDocument;
  dispatch: DocumentDispatch<ChatSessionAction>;
  /** Attachment service for uploading staged files before dispatch. */
  attachments?: IAttachmentService;
  className?: string;
  /** Optional content rendered above the chat area, inside the drag-and-drop
   *  root so file drops over this region are still captured (e.g. a Connect
   *  DocumentToolbar). */
  header?: ReactNode;
};

export function ChatSession({ document, dispatch, attachments, className, header }: ChatSessionProps) {
  const [showTestPane, setShowTestPane] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { isDark, toggle: toggleDarkMode } = useDarkMode(rootRef);

  const state = document.state.global;

  const toggleTestPane = useCallback(() => {
    setShowTestPane((prev) => !prev);
  }, []);

  const addFilesRef = useRef<((files: FileList) => void) | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const dragDepthRef = useRef(0);

  const onDragOver = useCallback((e: DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);
  const onDragEnter = useCallback((e: DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.stopPropagation();
      dragDepthRef.current += 1;
      if (dragDepthRef.current === 1) setIsDragOver(true);
    }
  }, []);
  const onDragLeave = useCallback((e: DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.stopPropagation();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDragOver(false);
    }
  }, []);
  const onDrop = useCallback((e: DragEvent) => {
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
    <AttachmentServiceProvider service={attachments}>
      <div ref={rootRef} className={cn('flex h-full w-full flex-col overflow-hidden bg-background text-foreground', className)} onDragOver={onDragOver} onDrop={onDrop} onDragEnter={onDragEnter} onDragLeave={onDragLeave}>
        {header}
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
            <ChatInputBar dispatch={dispatch} attachments={attachments} disabled={state.status !== 'ACTIVE'} addFilesRef={addFilesRef} />
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
    </AttachmentServiceProvider>
  );
}
