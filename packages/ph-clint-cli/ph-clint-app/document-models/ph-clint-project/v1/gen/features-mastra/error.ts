export type ErrorCode =
  | "InvalidAgentIdError"
  | "InvalidAgentNameError"
  | "MastraNotEnabledError"
  | "PowerhouseNotEnabledError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class InvalidAgentIdError extends Error implements ReducerError {
  errorCode = "InvalidAgentIdError" as ErrorCode;
  constructor(message = "InvalidAgentIdError") {
    super(message);
  }
}

export class InvalidAgentNameError extends Error implements ReducerError {
  errorCode = "InvalidAgentNameError" as ErrorCode;
  constructor(message = "InvalidAgentNameError") {
    super(message);
  }
}

export class MastraNotEnabledError extends Error implements ReducerError {
  errorCode = "MastraNotEnabledError" as ErrorCode;
  constructor(message = "MastraNotEnabledError") {
    super(message);
  }
}

export class PowerhouseNotEnabledError extends Error implements ReducerError {
  errorCode = "PowerhouseNotEnabledError" as ErrorCode;
  constructor(message = "PowerhouseNotEnabledError") {
    super(message);
  }
}

export const errors = {
  EnableMastra: { InvalidAgentIdError, InvalidAgentNameError },
  SetEnableChat: { MastraNotEnabledError, PowerhouseNotEnabledError },
};
