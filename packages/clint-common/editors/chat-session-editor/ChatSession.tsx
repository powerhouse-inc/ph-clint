import type { IAttachmentService } from '@powerhousedao/reactor-attachments';
import type { DocumentDispatch } from '@powerhousedao/reactor-browser';
import type { ChatSessionAction, ChatSessionDocument } from 'document-models/chat-session';
import { hasMessageContent } from 'document-models/chat-session';
import { useCallback, useEffect, useRef, useState, type ComponentType, type DragEvent, type ReactNode } from 'react';
import { PaperclipIcon } from 'lucide-react';
import { AgentInfoHeader, type AgentAvatarProps } from './components/AgentInfoHeader.js';
import { ChatInputBar } from './components/ChatInputBar.js';
import { AttachmentServiceProvider } from './components/ContentPartRenderer.js';
import { ToolRenderersProvider, type ToolRenderers } from './components/tool-rendering.js';
import { ConversationView } from './components/ConversationView.js';
import { SessionStatusBar } from './components/SessionStatusBar.js';
import { TestPane } from './components/test-pane/TestPane.js';
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
  /** Override the agent avatar in the info header (e.g. an animated logo). */
  agentAvatar?: ComponentType<AgentAvatarProps>;
  /** Custom renderers for agent tool calls/results, keyed by tool name (or a
   *  resolver function). Tools without a match use the built-in tool UI. */
  toolRenderers?: ToolRenderers;
};

/** How long to keep the responding state lit after trailing assistant text
 *  stops growing, so the final streamed answer animates to its end. */
const RESPONDING_GRACE_MS = 1000;

export function ChatSession({ document, dispatch, attachments, className, header, agentAvatar, toolRenderers }: ChatSessionProps) {
  const [showTestPane, setShowTestPane] = useState(false);

  const state = document.state.global;

  // Whether the agent is mid-turn — derived from message shape, no persisted
  // per-turn op (the document is append-only and shouldn't carry UI state).
  //
  // Definite "working" shapes animate immediately: a non-empty USER message
  // (turn started), a TOOL result (a tool returned, agent continues), or an
  // ASSISTANT message with a pending TOOL_CALL (tool dispatched). Trailing
  // assistant text is ambiguous — streaming and finished look identical in the
  // document — so a grace timer keeps it lit while that text keeps growing and
  // releases shortly after it goes quiet.
  const [responding, setResponding] = useState(false);
  const respondingRef = useRef(false);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeenRef = useRef<{ id: string; size: number } | null>(null);

  useEffect(() => {
    const setResp = (v: boolean) => {
      respondingRef.current = v;
      setResponding(v);
    };
    const clearGrace = () => {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
    };
    const armGrace = () => {
      clearGrace();
      graceTimerRef.current = setTimeout(() => {
        graceTimerRef.current = null;
        setResp(false);
      }, RESPONDING_GRACE_MS);
    };

    const messages = state.messages;
    const last = messages.length > 0 ? messages[messages.length - 1] : undefined;

    if (state.status !== 'ACTIVE' || state.interruptRequested || !last) {
      clearGrace();
      setResp(false);
      lastSeenRef.current = null;
      return;
    }

    const working = (last.role === 'USER' && hasMessageContent(last)) || last.role === 'TOOL' || (last.role === 'ASSISTANT' && last.content.some((p) => p.type === 'TOOL_CALL'));
    if (working) {
      clearGrace();
      setResp(true);
      lastSeenRef.current = null;
      return;
    }

    // Ambiguous trailing assistant text: keep lit while it grows (streaming) or
    // at the moment we leave a working phase still lit; wind down once quiet.
    const size = last.role === 'ASSISTANT' ? last.content.reduce((n, p) => n + (p.type === 'TEXT' && p.text ? p.text.length : 0), 0) : 0;
    const prev = lastSeenRef.current;
    lastSeenRef.current = { id: last.id, size };
    const grew = !!prev && prev.id === last.id && size > prev.size;
    const leftWorkingPhase = !prev && respondingRef.current;
    if (grew || leftWorkingPhase) {
      setResp(true);
      armGrace();
    }
  }, [state]);

  useEffect(
    () => () => {
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
    },
    [],
  );

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
      <ToolRenderersProvider renderers={toolRenderers}>
        <div className={cn('clint-chat-root flex h-full w-full flex-col overflow-hidden bg-background text-foreground', className)} onDragOver={onDragOver} onDrop={onDrop} onDragEnter={onDragEnter} onDragLeave={onDragLeave}>
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
              <AgentInfoHeader agent={state.agent} responding={responding} avatar={agentAvatar} />
              <ConversationView messages={state.messages} responding={responding} />
              <ChatInputBar dispatch={dispatch} attachments={attachments} disabled={state.status !== 'ACTIVE'} responding={responding} addFilesRef={addFilesRef} />
              {/* Test pane has no visible toggle; Ctrl/Cmd+Shift+T opens it for development. */}
              <SessionStatusBar status={state.status} startedAt={state.startedAt} endedAt={state.endedAt} usage={state.usage} messageCount={state.messages.length} />
            </div>

            {showTestPane && (
              <div className="w-[380px] shrink-0 overflow-hidden">
                <TestPane dispatch={dispatch} />
              </div>
            )}
          </div>
        </div>
      </ToolRenderersProvider>
    </AttachmentServiceProvider>
  );
}
