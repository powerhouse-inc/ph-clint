export type ErrorCode =
  | "MastraNotEnabledError"
  | "InvalidModelIdError"
  | "DuplicateModelError"
  | "ModelNotFoundError"
  | "ModelInUseError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class MastraNotEnabledError extends Error implements ReducerError {
  errorCode = "MastraNotEnabledError" as ErrorCode;
  constructor(message = "MastraNotEnabledError") {
    super(message);
  }
}

export class InvalidModelIdError extends Error implements ReducerError {
  errorCode = "InvalidModelIdError" as ErrorCode;
  constructor(message = "InvalidModelIdError") {
    super(message);
  }
}

export class DuplicateModelError extends Error implements ReducerError {
  errorCode = "DuplicateModelError" as ErrorCode;
  constructor(message = "DuplicateModelError") {
    super(message);
  }
}

export class ModelNotFoundError extends Error implements ReducerError {
  errorCode = "ModelNotFoundError" as ErrorCode;
  constructor(message = "ModelNotFoundError") {
    super(message);
  }
}

export class ModelInUseError extends Error implements ReducerError {
  errorCode = "ModelInUseError" as ErrorCode;
  constructor(message = "ModelInUseError") {
    super(message);
  }
}

export const errors = {
  AddModel: { MastraNotEnabledError, InvalidModelIdError, DuplicateModelError },
  RemoveModel: { MastraNotEnabledError, ModelNotFoundError, ModelInUseError },
  SetDefaultModel: { MastraNotEnabledError, ModelNotFoundError },
};
