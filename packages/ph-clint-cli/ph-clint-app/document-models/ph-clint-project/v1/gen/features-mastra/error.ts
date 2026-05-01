export type ErrorCode =
  | "InvalidAgentIdError"
  | "InvalidAgentNameError"
  | "MastraNotEnabledError"
  | "InvalidModelIdError"
  | "DuplicateModelError"
  | "ModelNotFoundError"
  | "InvalidProfileIdError"
  | "DuplicateProfileError"
  | "ProfileNotFoundError";

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

export class InvalidProfileIdError extends Error implements ReducerError {
  errorCode = "InvalidProfileIdError" as ErrorCode;
  constructor(message = "InvalidProfileIdError") {
    super(message);
  }
}

export class DuplicateProfileError extends Error implements ReducerError {
  errorCode = "DuplicateProfileError" as ErrorCode;
  constructor(message = "DuplicateProfileError") {
    super(message);
  }
}

export class ProfileNotFoundError extends Error implements ReducerError {
  errorCode = "ProfileNotFoundError" as ErrorCode;
  constructor(message = "ProfileNotFoundError") {
    super(message);
  }
}

export const errors = {
  EnableMastra: { InvalidAgentIdError, InvalidAgentNameError },
  SetAgentId: { MastraNotEnabledError, InvalidAgentIdError },
  SetAgentName: { MastraNotEnabledError, InvalidAgentNameError },
  AddModel: { MastraNotEnabledError, InvalidModelIdError, DuplicateModelError },
  RemoveModel: { MastraNotEnabledError, ModelNotFoundError },
  SetDefaultModel: { MastraNotEnabledError, ModelNotFoundError },
  AddProfile: {
    MastraNotEnabledError,
    InvalidProfileIdError,
    DuplicateProfileError,
    ProfileNotFoundError,
  },
  UpdateProfile: { MastraNotEnabledError, ProfileNotFoundError },
  RemoveProfile: { MastraNotEnabledError, ProfileNotFoundError },
  ReorderProfiles: { MastraNotEnabledError, ProfileNotFoundError },
  SetAgentDescription: { MastraNotEnabledError },
  SetAgentImage: { MastraNotEnabledError },
};
