export type ErrorCode =
  | "InvalidSkillNameError"
  | "DuplicateSkillError"
  | "SkillNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class InvalidSkillNameError extends Error implements ReducerError {
  errorCode = "InvalidSkillNameError" as ErrorCode;
  constructor(message = "InvalidSkillNameError") {
    super(message);
  }
}

export class DuplicateSkillError extends Error implements ReducerError {
  errorCode = "DuplicateSkillError" as ErrorCode;
  constructor(message = "DuplicateSkillError") {
    super(message);
  }
}

export class SkillNotFoundError extends Error implements ReducerError {
  errorCode = "SkillNotFoundError" as ErrorCode;
  constructor(message = "SkillNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddExternalSkill: { InvalidSkillNameError, DuplicateSkillError },

  RemoveExternalSkill: { SkillNotFoundError },

  SetExternalSkillName: {
    SkillNotFoundError,
    InvalidSkillNameError,
    DuplicateSkillError,
  },

  SetExternalSkillGithubUrl: { SkillNotFoundError },
};
