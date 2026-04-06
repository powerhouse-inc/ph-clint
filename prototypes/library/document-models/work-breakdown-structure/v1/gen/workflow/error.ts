export type ErrorCode = "DuplicateGoalIdError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class DuplicateGoalIdError extends Error implements ReducerError {
  errorCode = "DuplicateGoalIdError" as ErrorCode;
  constructor(message = "DuplicateGoalIdError") {
    super(message);
  }
}

export const errors = {
  CreateGoal: { DuplicateGoalIdError },
};
