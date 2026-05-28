export type ErrorCode = 'MastraNotEnabledError' | 'InvalidProfileIdError' | 'DuplicateProfileError' | 'ProfileNotFoundError' | 'ProfileInUseError';

export interface ReducerError {
  errorCode: ErrorCode;
}

export class MastraNotEnabledError extends Error implements ReducerError {
  errorCode = 'MastraNotEnabledError' as ErrorCode;
  constructor(message = 'MastraNotEnabledError') {
    super(message);
  }
}

export class InvalidProfileIdError extends Error implements ReducerError {
  errorCode = 'InvalidProfileIdError' as ErrorCode;
  constructor(message = 'InvalidProfileIdError') {
    super(message);
  }
}

export class DuplicateProfileError extends Error implements ReducerError {
  errorCode = 'DuplicateProfileError' as ErrorCode;
  constructor(message = 'DuplicateProfileError') {
    super(message);
  }
}

export class ProfileNotFoundError extends Error implements ReducerError {
  errorCode = 'ProfileNotFoundError' as ErrorCode;
  constructor(message = 'ProfileNotFoundError') {
    super(message);
  }
}

export class ProfileInUseError extends Error implements ReducerError {
  errorCode = 'ProfileInUseError' as ErrorCode;
  constructor(message = 'ProfileInUseError') {
    super(message);
  }
}

export const errors = {
  AddProfile: {
    MastraNotEnabledError,
    InvalidProfileIdError,
    DuplicateProfileError,
    ProfileNotFoundError,
  },
  UpdateProfile: { MastraNotEnabledError, ProfileNotFoundError },
  RemoveProfile: {
    MastraNotEnabledError,
    ProfileNotFoundError,
    ProfileInUseError,
  },
  ReorderProfiles: { MastraNotEnabledError, ProfileNotFoundError },
};
