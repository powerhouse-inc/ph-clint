export type ErrorCode = "SlideNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class SlideNotFoundError extends Error implements ReducerError {
  errorCode = "SlideNotFoundError" as ErrorCode;
  constructor(message = "SlideNotFoundError") {
    super(message);
  }
}

export const errors = {
  DeleteSlide: {
    SlideNotFoundError,
  },
  DuplicateSlide: {
    SlideNotFoundError,
  },
  ReorderSlides: {
    SlideNotFoundError,
  },
  SetSlideTemplate: {
    SlideNotFoundError,
  },
  UpdateSlideContent: {
    SlideNotFoundError,
  },
};
