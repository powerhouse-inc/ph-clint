export type ErrorCode = "DuplicateProjectError" | "ProjectNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class DuplicateProjectError extends Error implements ReducerError {
  errorCode = "DuplicateProjectError" as ErrorCode;
  constructor(message = "DuplicateProjectError") {
    super(message);
  }
}

export class ProjectNotFoundError extends Error implements ReducerError {
  errorCode = "ProjectNotFoundError" as ErrorCode;
  constructor(message = "ProjectNotFoundError") {
    super(message);
  }
}

export const errors = {
  RegisterProject: { DuplicateProjectError },
  UpdateProjectConfig: { ProjectNotFoundError },
  UpdateProjectStatus: { ProjectNotFoundError, DuplicateProjectError },
};
