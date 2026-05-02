import type { DocumentDispatch } from '@powerhousedao/reactor-browser';
import type { ChatSessionAction, UserContentPartInput } from 'document-models/chat-session';
import { addUserMessage } from 'document-models/chat-session';
import { generateId } from 'document-model';
import { useCallback, useEffect, useState } from 'react';
import type { PromptInputMessage } from './ai-elements/prompt-input.js';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit, usePromptInputAttachments } from './ai-elements/prompt-input.js';
import { FileIcon, ImageIcon, XIcon } from 'lucide-react';

function AttachButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => attachments.openFileDialog()}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
    >
      <ImageIcon className="size-4" />
      Add photos or files
    </button>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentPreviews() {
  const { files, remove } = usePromptInputAttachments();
  const [sizes, setSizes] = useState<Record<string, number>>({});

  useEffect(() => {
    for (const file of files) {
      if (sizes[file.id] !== undefined || !file.url.startsWith('blob:')) continue;
      void fetch(file.url)
        .then((r) => r.blob())
        .then((b) => setSizes((prev) => ({ ...prev, [file.id]: b.size })));
    }
  }, [files, sizes]);

  if (files.length === 0) return null;

  return (
    <div className="chat-attachment-gallery flex w-full gap-2 overflow-x-auto px-3 pb-1 pt-2">
      {files.map((file) => {
        const isImage = file.mediaType.startsWith('image/');
        const size = sizes[file.id];
        return (
          <div key={file.id} className="group/att relative flex w-64 shrink-0 gap-2 rounded-md border border-border bg-muted/30 p-1.5">
            {isImage ? (
              <img src={file.url} alt={file.filename} className="size-16 shrink-0 rounded object-cover" />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                <FileIcon className="size-6" />
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <p className="truncate text-sm font-medium" title={file.filename}>
                {file.filename}
              </p>
              <p className="truncate text-xs text-muted-foreground" title={file.mediaType + (size !== undefined ? ` · ${formatBytes(size)}` : '')}>
                {file.mediaType}
                {size !== undefined && ` · ${formatBytes(size)}`}
              </p>
            </div>
            <button type="button" onClick={() => remove(file.id)} className="absolute -top-1.5 -right-1.5 hidden size-5 items-center justify-center rounded-full bg-foreground text-background group-hover/att:flex">
              <XIcon className="size-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface ChatInputBarProps {
  dispatch: DocumentDispatch<ChatSessionAction>;
  disabled?: boolean;
}

export function ChatInputBar({ dispatch, disabled }: ChatInputBarProps) {
  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const text = message.text.trim();
      if (!text && message.files.length === 0) return;

      const content: UserContentPartInput[] = [];

      if (text) {
        content.push({
          id: generateId(),
          type: 'TEXT',
          text,
        });
      }

      for (const file of message.files) {
        const isImage = file.mediaType.startsWith('image/');
        // Extract base64 data from data URL (data:<mediaType>;base64,<data>)
        let data: string | undefined;
        let url: string | undefined;
        if (file.url.startsWith('data:')) {
          const commaIndex = file.url.indexOf(',');
          if (commaIndex !== -1) {
            data = file.url.slice(commaIndex + 1);
          }
        } else {
          url = file.url;
        }
        content.push({
          id: generateId(),
          type: isImage ? 'IMAGE' : 'FILE',
          filename: file.filename,
          mediaType: file.mediaType,
          url,
          data,
        });
      }

      dispatch(
        addUserMessage({
          id: generateId(),
          content,
          createdAt: new Date().toISOString(),
        }),
      );
    },
    [dispatch],
  );

  return (
    <div className="shrink-0 border-t border-border bg-background px-4 py-3">
      <PromptInput onSubmit={handleSubmit} multiple className="mx-auto max-w-[1100px]">
        <PromptInputTextarea disabled={disabled} placeholder={disabled ? 'Session is not active' : 'Type a message...'} />
        <AttachmentPreviews />
        <PromptInputFooter>
          <AttachButton disabled={disabled} />
          <PromptInputSubmit disabled={disabled} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
