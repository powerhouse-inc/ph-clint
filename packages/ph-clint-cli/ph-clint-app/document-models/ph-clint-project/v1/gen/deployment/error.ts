export type ErrorCode = "DuplicateResourceError" | "ResourceNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class DuplicateResourceError extends Error implements ReducerError {
  errorCode = "DuplicateResourceError" as ErrorCode;
  constructor(message = "DuplicateResourceError") {
    super(message);
  }
}

export class ResourceNotFoundError extends Error implements ReducerError {
  errorCode = "ResourceNotFoundError" as ErrorCode;
  constructor(message = "ResourceNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddSupportedResource: { DuplicateResourceError },

  RemoveSupportedResource: { ResourceNotFoundError },
};
