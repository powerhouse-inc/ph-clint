export type ErrorCode = "ProjectNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class ProjectNotFoundError extends Error implements ReducerError {
  errorCode = "ProjectNotFoundError" as ErrorCode;
  constructor(message = "ProjectNotFoundError") {
    super(message);
  }
}

export const errors = {
  RunProject: { ProjectNotFoundError },
  StopProject: { ProjectNotFoundError },
  DeleteProject: { ProjectNotFoundError },
};
