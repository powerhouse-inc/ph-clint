export type ErrorCode = "SlideNotFoundError" | "ItemNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class SlideNotFoundError extends Error implements ReducerError {
  errorCode = "SlideNotFoundError" as ErrorCode;
  constructor(message = "SlideNotFoundError") {
    super(message);
  }
}

export class ItemNotFoundError extends Error implements ReducerError {
  errorCode = "ItemNotFoundError" as ErrorCode;
  constructor(message = "ItemNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddLink: {
    SlideNotFoundError,
  },
  UpdateLink: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  DeleteLink: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  ReorderLinks: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
};
