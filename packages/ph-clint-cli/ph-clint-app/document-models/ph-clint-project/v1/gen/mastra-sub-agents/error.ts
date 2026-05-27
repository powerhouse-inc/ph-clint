export type ErrorCode = 'MastraNotEnabledError' | 'InvalidAgentIdError' | 'InvalidAgentNameError' | 'DuplicateAgentIdError' | 'ModelReferenceNotFoundError' | 'AgentNotFoundError';

export interface ReducerError {
  errorCode: ErrorCode;
}

export class MastraNotEnabledError extends Error implements ReducerError {
  errorCode = 'MastraNotEnabledError' as ErrorCode;
  constructor(message = 'MastraNotEnabledError') {
    super(message);
  }
}

export class InvalidAgentIdError extends Error implements ReducerError {
  errorCode = 'InvalidAgentIdError' as ErrorCode;
  constructor(message = 'InvalidAgentIdError') {
    super(message);
  }
}

export class InvalidAgentNameError extends Error implements ReducerError {
  errorCode = 'InvalidAgentNameError' as ErrorCode;
  constructor(message = 'InvalidAgentNameError') {
    super(message);
  }
}

export class DuplicateAgentIdError extends Error implements ReducerError {
  errorCode = 'DuplicateAgentIdError' as ErrorCode;
  constructor(message = 'DuplicateAgentIdError') {
    super(message);
  }
}

export class ModelReferenceNotFoundError extends Error implements ReducerError {
  errorCode = 'ModelReferenceNotFoundError' as ErrorCode;
  constructor(message = 'ModelReferenceNotFoundError') {
    super(message);
  }
}

export class AgentNotFoundError extends Error implements ReducerError {
  errorCode = 'AgentNotFoundError' as ErrorCode;
  constructor(message = 'AgentNotFoundError') {
    super(message);
  }
}

export const errors = {
  AddSubAgent: {
    MastraNotEnabledError,
    InvalidAgentIdError,
    InvalidAgentNameError,
    DuplicateAgentIdError,
    ModelReferenceNotFoundError,
  },
  RemoveSubAgent: { MastraNotEnabledError, AgentNotFoundError },
  SetSubAgentName: {
    MastraNotEnabledError,
    AgentNotFoundError,
    InvalidAgentNameError,
  },
  SetSubAgentDescription: { MastraNotEnabledError, AgentNotFoundError },
};
