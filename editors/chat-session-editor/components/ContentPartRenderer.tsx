import type { ContentPart } from 'document-models/chat-session';
import { Reasoning, ReasoningTrigger, ReasoningContent } from './ai-elements/reasoning.js';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from './ai-elements/tool.js';
import { MessageResponse } from './ai-elements/message.js';
import { AlertTriangleIcon, DownloadIcon, FileIcon, ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils.js';

interface ContentPartRendererProps {
  part: ContentPart;
  linkedResult?: ContentPart;
}

export function ContentPartRenderer({ part, linkedResult }: ContentPartRendererProps) {
  switch (part.type) {
    case 'TEXT':
      return <MessageResponse>{part.text ?? ''}</MessageResponse>;

    case 'REASONING':
      return (
        <Reasoning defaultOpen={false}>
          <ReasoningTrigger />
          <ReasoningContent>{part.text ?? ''}</ReasoningContent>
        </Reasoning>
      );

    case 'TOOL_CALL':
      return <ToolCallRenderer part={part} linkedResult={linkedResult} />;

    case 'TOOL_RESULT':
      return <ToolResultRenderer part={part} />;

    case 'IMAGE':
      return <ImagePartRenderer part={part} />;

    case 'FILE':
      return <FilePartRenderer part={part} />;

    case 'ERROR':
      return <ErrorPartRenderer part={part} />;

    default:
      return <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground">Unknown content type: {part.type}</div>;
  }
}

function getToolPreview(args: string | null | undefined, result: string | null | undefined, isError: boolean): string | undefined {
  const parts: string[] = [];

  if (args) {
    try {
      const parsed = JSON.parse(args) as Record<string, unknown>;
      const entries = Object.entries(parsed).slice(0, 3);
      const summary = entries
        .map(([k, v]) => {
          const val = typeof v === 'string' ? (v.length > 30 ? v.slice(0, 30) + '...' : v) : JSON.stringify(v);
          return `${k}: ${val}`;
        })
        .join(', ');
      if (summary) parts.push(summary);
    } catch {
      // not JSON
    }
  }

  if (result) {
    const truncated = result.length > 50 ? result.slice(0, 50) + '...' : result;
    parts.push((isError ? 'error: ' : '-> ') + truncated);
  }

  return parts.length > 0 ? parts.join(' ') : undefined;
}

function ToolCallRenderer({ part, linkedResult }: { part: ContentPart; linkedResult?: ContentPart }) {
  let parsedArgs: unknown = undefined;
  if (part.args) {
    try {
      parsedArgs = JSON.parse(part.args);
    } catch {
      parsedArgs = part.args;
    }
  }

  let parsedResult: unknown = undefined;
  if (linkedResult?.result) {
    try {
      parsedResult = JSON.parse(linkedResult.result);
    } catch {
      parsedResult = linkedResult.result;
    }
  }

  const hasResult = !!linkedResult;
  const isError = linkedResult?.isError ?? false;
  const preview = getToolPreview(part.args, linkedResult?.result, isError);

  return (
    <Tool className={cn(hasResult && (isError ? 'border-red-300 dark:border-red-800' : 'border-green-300 dark:border-green-800'))}>
      <ToolHeader type="dynamic-tool" toolName={part.toolName ?? 'unknown'} title={part.toolName ?? 'Tool Call'} state={isError ? 'output-error' : hasResult ? 'output-available' : 'input-available'} preview={preview} />
      <ToolContent>
        {parsedArgs !== undefined && <ToolInput input={parsedArgs} />}
        {hasResult && <ToolOutput output={parsedResult} errorText={isError ? (linkedResult.result ?? 'Error') : undefined} />}
      </ToolContent>
    </Tool>
  );
}

function ToolResultRenderer({ part }: { part: ContentPart }) {
  let parsedResult: unknown = undefined;
  if (part.result) {
    try {
      parsedResult = JSON.parse(part.result);
    } catch {
      parsedResult = part.result;
    }
  }

  return (
    <Tool>
      <ToolHeader type="dynamic-tool" toolName={part.toolName ?? 'unknown'} title={`${part.toolName ?? 'Tool'} result`} state={part.isError ? 'output-error' : 'output-available'} />
      <ToolContent>
        <ToolOutput output={parsedResult} errorText={part.isError ? (part.result ?? 'Error') : undefined} />
      </ToolContent>
    </Tool>
  );
}

function getDownloadHref(part: ContentPart): string | undefined {
  if (part.url) return part.url;
  if (part.data) return `data:${part.mediaType ?? 'application/octet-stream'};base64,${part.data}`;
  return undefined;
}

function ImagePartRenderer({ part }: { part: ContentPart }) {
  const src = part.url ?? (part.data ? `data:${part.mediaType ?? 'image/png'};base64,${part.data}` : undefined);
  const href = getDownloadHref(part);

  if (!src) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
        <ImageIcon className="size-4" />
        {part.filename ?? 'Image (no source)'}
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="group/img relative inline-block">
        <img src={src} alt={part.filename ?? 'Image'} className="max-h-64 rounded-md border border-border" />
        {href && (
          <a href={href} download={part.filename ?? 'image.png'} className="absolute top-2 right-2 hidden rounded-md bg-black/60 p-1.5 text-white hover:bg-black/80 group-hover/img:block">
            <DownloadIcon className="size-4" />
          </a>
        )}
      </div>
    </div>
  );
}

function FilePartRenderer({ part }: { part: ContentPart }) {
  const href = getDownloadHref(part);
  const inner = (
    <>
      <FileIcon className="size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{part.filename ?? 'File'}</p>
        {part.mediaType && <p className="truncate text-xs text-muted-foreground">{part.mediaType}</p>}
      </div>
      {href && <DownloadIcon className="size-3.5 shrink-0 text-muted-foreground" />}
    </>
  );

  if (href) {
    return (
      <a href={href} download={part.filename ?? 'file'} className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3 text-sm hover:bg-muted transition-colors">
        {inner}
      </a>
    );
  }

  return <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3 text-sm">{inner}</div>;
}

function ErrorPartRenderer({ part }: { part: ContentPart }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
      <span>{part.error ?? part.text ?? 'Unknown error'}</span>
    </div>
  );
}
