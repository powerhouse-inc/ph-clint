export type ErrorCode =
  | "DuplicateStakeholderError"
  | "StakeholderNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class DuplicateStakeholderError extends Error implements ReducerError {
  errorCode = "DuplicateStakeholderError" as ErrorCode;
  constructor(message = "DuplicateStakeholderError") {
    super(message);
  }
}

export class StakeholderNotFoundError extends Error implements ReducerError {
  errorCode = "StakeholderNotFoundError" as ErrorCode;
  constructor(message = "StakeholderNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddStakeholder: { DuplicateStakeholderError },
  RemoveStakeholder: { StakeholderNotFoundError },
  SetStakeholderName: { StakeholderNotFoundError },
  SetStakeholderAddress: { StakeholderNotFoundError },
  SetStakeholderAvatar: { StakeholderNotFoundError },
  MoveStakeholder: { StakeholderNotFoundError },
};
