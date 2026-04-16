export type ErrorCode = "MastraRequiresRoutineError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class MastraRequiresRoutineError extends Error implements ReducerError {
  errorCode = "MastraRequiresRoutineError" as ErrorCode;
  constructor(message = "MastraRequiresRoutineError") {
    super(message);
  }
}

export const errors = {
  DisableRoutine: { MastraRequiresRoutineError },
};
