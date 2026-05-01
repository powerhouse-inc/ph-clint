export type ErrorCode = "InvalidVersionError" | "PublishRecordNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class InvalidVersionError extends Error implements ReducerError {
  errorCode = "InvalidVersionError" as ErrorCode;
  constructor(message = "InvalidVersionError") {
    super(message);
  }
}

export class PublishRecordNotFoundError extends Error implements ReducerError {
  errorCode = "PublishRecordNotFoundError" as ErrorCode;
  constructor(message = "PublishRecordNotFoundError") {
    super(message);
  }
}

export const errors = {
  BumpVersion: { InvalidVersionError },
  SetPublishStatus: { PublishRecordNotFoundError },
};
