export type ErrorCode = 'MessageNotFoundError' | 'NotUserMessageError';

export interface ReducerError {
  errorCode: ErrorCode;
}

export class MessageNotFoundError extends Error implements ReducerError {
  errorCode = 'MessageNotFoundError' as ErrorCode;
  constructor(message = 'MessageNotFoundError') {
    super(message);
  }
}

export class NotUserMessageError extends Error implements ReducerError {
  errorCode = 'NotUserMessageError' as ErrorCode;
  constructor(message = 'NotUserMessageError') {
    super(message);
  }
}

export const errors = {
  DeleteUserMessage: { MessageNotFoundError, NotUserMessageError },
};
