export type ErrorCode =
  | "MastraNotEnabledError"
  | "AgentNotFoundError"
  | "ModelReferenceNotFoundError"
  | "ProfileReferenceNotFoundError"
  | "InvalidSkillNameError"
  | "SkillNotFoundError"
  | "InvalidToolPatternError"
  | "ToolPatternNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class MastraNotEnabledError extends Error implements ReducerError {
  errorCode = "MastraNotEnabledError" as ErrorCode;
  constructor(message = "MastraNotEnabledError") {
    super(message);
  }
}

export class AgentNotFoundError extends Error implements ReducerError {
  errorCode = "AgentNotFoundError" as ErrorCode;
  constructor(message = "AgentNotFoundError") {
    super(message);
  }
}

export class ModelReferenceNotFoundError extends Error implements ReducerError {
  errorCode = "ModelReferenceNotFoundError" as ErrorCode;
  constructor(message = "ModelReferenceNotFoundError") {
    super(message);
  }
}

export class ProfileReferenceNotFoundError
  extends Error
  implements ReducerError
{
  errorCode = "ProfileReferenceNotFoundError" as ErrorCode;
  constructor(message = "ProfileReferenceNotFoundError") {
    super(message);
  }
}

export class InvalidSkillNameError extends Error implements ReducerError {
  errorCode = "InvalidSkillNameError" as ErrorCode;
  constructor(message = "InvalidSkillNameError") {
    super(message);
  }
}

export class SkillNotFoundError extends Error implements ReducerError {
  errorCode = "SkillNotFoundError" as ErrorCode;
  constructor(message = "SkillNotFoundError") {
    super(message);
  }
}

export class InvalidToolPatternError extends Error implements ReducerError {
  errorCode = "InvalidToolPatternError" as ErrorCode;
  constructor(message = "InvalidToolPatternError") {
    super(message);
  }
}

export class ToolPatternNotFoundError extends Error implements ReducerError {
  errorCode = "ToolPatternNotFoundError" as ErrorCode;
  constructor(message = "ToolPatternNotFoundError") {
    super(message);
  }
}

export const errors = {
  SetAgentModel: {
    MastraNotEnabledError,
    AgentNotFoundError,
    ModelReferenceNotFoundError,
  },
  AddAgentProfileRef: {
    MastraNotEnabledError,
    AgentNotFoundError,
    ProfileReferenceNotFoundError,
  },
  RemoveAgentProfileRef: {
    MastraNotEnabledError,
    AgentNotFoundError,
    ProfileReferenceNotFoundError,
  },
  ReorderAgentProfileRefs: {
    MastraNotEnabledError,
    AgentNotFoundError,
    ProfileReferenceNotFoundError,
  },
  AddAgentSkill: {
    MastraNotEnabledError,
    AgentNotFoundError,
    InvalidSkillNameError,
  },
  RemoveAgentSkill: {
    MastraNotEnabledError,
    AgentNotFoundError,
    SkillNotFoundError,
  },
  AddAgentToolPattern: {
    MastraNotEnabledError,
    AgentNotFoundError,
    InvalidToolPatternError,
  },
  RemoveAgentToolPattern: {
    MastraNotEnabledError,
    AgentNotFoundError,
    ToolPatternNotFoundError,
  },
};
