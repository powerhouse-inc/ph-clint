export type ErrorCode = "InvalidAgentImageError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class InvalidAgentImageError extends Error implements ReducerError {
  errorCode = "InvalidAgentImageError" as ErrorCode;
  constructor(message = "InvalidAgentImageError") {
    super(message);
  }
}

export const errors = {
  ImportSpec: { InvalidAgentImageError },
};
