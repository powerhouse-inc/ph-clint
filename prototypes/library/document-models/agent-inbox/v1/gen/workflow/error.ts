export type ErrorCode = "ThreadNotFoundError" | "InvalidStatusError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class ThreadNotFoundError extends Error implements ReducerError {
  errorCode = "ThreadNotFoundError" as ErrorCode;
  constructor(message = "ThreadNotFoundError") {
    super(message);
  }
}

export class InvalidStatusError extends Error implements ReducerError {
  errorCode = "InvalidStatusError" as ErrorCode;
  constructor(message = "InvalidStatusError") {
    super(message);
  }
}

export const errors = {
  ProposeThreadResolved: { ThreadNotFoundError },
  ConfirmThreadResolved: { ThreadNotFoundError, InvalidStatusError },
  ArchiveThread: { ThreadNotFoundError },
  ReopenThread: { ThreadNotFoundError },
};
