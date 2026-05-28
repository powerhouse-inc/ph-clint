export type ErrorCode = 'MastraNotEnabledError' | 'InvalidAgentNameError' | 'InvalidAgentImageError';

export interface ReducerError {
  errorCode: ErrorCode;
}

export class MastraNotEnabledError extends Error implements ReducerError {
  errorCode = 'MastraNotEnabledError' as ErrorCode;
  constructor(message = 'MastraNotEnabledError') {
    super(message);
  }
}

export class InvalidAgentNameError extends Error implements ReducerError {
  errorCode = 'InvalidAgentNameError' as ErrorCode;
  constructor(message = 'InvalidAgentNameError') {
    super(message);
  }
}

export class InvalidAgentImageError extends Error implements ReducerError {
  errorCode = 'InvalidAgentImageError' as ErrorCode;
  constructor(message = 'InvalidAgentImageError') {
    super(message);
  }
}

export const errors = {
  SetMainAgentName: { MastraNotEnabledError, InvalidAgentNameError },
  SetMainAgentDescription: { MastraNotEnabledError },
  ClearMainAgentDescription: { MastraNotEnabledError },
  SetMainAgentImage: { MastraNotEnabledError, InvalidAgentImageError },
  ClearMainAgentImage: { MastraNotEnabledError },
};
