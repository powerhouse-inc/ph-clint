export type ErrorCode =
  | "InvalidNameError"
  | "InvalidVersionError"
  | "InvalidScopeError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class InvalidNameError extends Error implements ReducerError {
  errorCode = "InvalidNameError" as ErrorCode;
  constructor(message = "InvalidNameError") {
    super(message);
  }
}

export class InvalidVersionError extends Error implements ReducerError {
  errorCode = "InvalidVersionError" as ErrorCode;
  constructor(message = "InvalidVersionError") {
    super(message);
  }
}

export class InvalidScopeError extends Error implements ReducerError {
  errorCode = "InvalidScopeError" as ErrorCode;
  constructor(message = "InvalidScopeError") {
    super(message);
  }
}

export const errors = {
  SetPackageName: { InvalidNameError },
  SetBin: { InvalidNameError },
  SetVersion: { InvalidVersionError },
  SetScope: { InvalidScopeError },
};
