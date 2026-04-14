export type ErrorCode =
  | "MessageNotFoundError"
  | "SenderNotFoundError"
  | "DuplicateReactionError"
  | "ReactionNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class MessageNotFoundError extends Error implements ReducerError {
  errorCode = "MessageNotFoundError" as ErrorCode;
  constructor(message = "MessageNotFoundError") {
    super(message);
  }
}

export class SenderNotFoundError extends Error implements ReducerError {
  errorCode = "SenderNotFoundError" as ErrorCode;
  constructor(message = "SenderNotFoundError") {
    super(message);
  }
}

export class DuplicateReactionError extends Error implements ReducerError {
  errorCode = "DuplicateReactionError" as ErrorCode;
  constructor(message = "DuplicateReactionError") {
    super(message);
  }
}

export class ReactionNotFoundError extends Error implements ReducerError {
  errorCode = "ReactionNotFoundError" as ErrorCode;
  constructor(message = "ReactionNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddReaction: {
    MessageNotFoundError,
    SenderNotFoundError,
    DuplicateReactionError,
  },
  RemoveReaction: { MessageNotFoundError, ReactionNotFoundError },
};
