export type ErrorCode =
  | "SenderNotFoundError"
  | "InvalidMentionError"
  | "MessageNotFoundError"
  | "ReaderNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class SenderNotFoundError extends Error implements ReducerError {
  errorCode = "SenderNotFoundError" as ErrorCode;
  constructor(message = "SenderNotFoundError") {
    super(message);
  }
}

export class InvalidMentionError extends Error implements ReducerError {
  errorCode = "InvalidMentionError" as ErrorCode;
  constructor(message = "InvalidMentionError") {
    super(message);
  }
}

export class MessageNotFoundError extends Error implements ReducerError {
  errorCode = "MessageNotFoundError" as ErrorCode;
  constructor(message = "MessageNotFoundError") {
    super(message);
  }
}

export class ReaderNotFoundError extends Error implements ReducerError {
  errorCode = "ReaderNotFoundError" as ErrorCode;
  constructor(message = "ReaderNotFoundError") {
    super(message);
  }
}

export const errors = {
  SendText: { SenderNotFoundError, InvalidMentionError },
  SendError: { SenderNotFoundError, InvalidMentionError },
  SendToolCall: { SenderNotFoundError, InvalidMentionError },
  SendToolResult: { SenderNotFoundError, InvalidMentionError },
  DeleteMessage: { MessageNotFoundError },
  MarkAsRead: { MessageNotFoundError, ReaderNotFoundError },
};
