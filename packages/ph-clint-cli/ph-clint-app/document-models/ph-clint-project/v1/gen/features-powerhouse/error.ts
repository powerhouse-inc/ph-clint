export type ErrorCode = "CannotLowerPowerhouseError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class CannotLowerPowerhouseError extends Error implements ReducerError {
  errorCode = "CannotLowerPowerhouseError" as ErrorCode;
  constructor(message = "CannotLowerPowerhouseError") {
    super(message);
  }
}

export const errors = {
  SetPowerhouseLevel: { CannotLowerPowerhouseError },
};
