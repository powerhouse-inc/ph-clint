export type ErrorCode = "InvalidPruneLengthError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class InvalidPruneLengthError extends Error implements ReducerError {
  errorCode = "InvalidPruneLengthError" as ErrorCode;
  constructor(message = "InvalidPruneLengthError") {
    super(message);
  }
}

export const errors = {
  SetPruneLength: { InvalidPruneLengthError },
};
