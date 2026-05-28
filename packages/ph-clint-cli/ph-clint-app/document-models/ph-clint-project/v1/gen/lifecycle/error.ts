export type ErrorCode = never;

export interface ReducerError {
  errorCode: ErrorCode;
}

export const errors = {
  ImportSpec: {},
};
