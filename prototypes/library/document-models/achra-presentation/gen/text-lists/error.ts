export type ErrorCode =
  | "SlideNotFoundError"
  | "ItemNotFoundError"
  | "InvalidColumnIndexError";

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

export class InvalidColumnIndexError extends Error implements ReducerError {
  errorCode = "InvalidColumnIndexError" as ErrorCode;
  constructor(message = "InvalidColumnIndexError") {
    super(message);
  }
}

export const errors = {
  AddTextItem: {
    SlideNotFoundError,
  },
  UpdateTextItem: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  DeleteTextItem: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  ReorderTextItems: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  SetColumnTitle: {
    SlideNotFoundError,
    InvalidColumnIndexError,
  },
  AddColumnBullet: {
    SlideNotFoundError,
    InvalidColumnIndexError,
  },
  UpdateColumnBullet: {
    SlideNotFoundError,
    InvalidColumnIndexError,
    ItemNotFoundError,
  },
  DeleteColumnBullet: {
    SlideNotFoundError,
    InvalidColumnIndexError,
    ItemNotFoundError,
  },
  ReorderColumnBullets: {
    SlideNotFoundError,
    InvalidColumnIndexError,
    ItemNotFoundError,
  },
  AddChecklistItem: {
    SlideNotFoundError,
  },
  UpdateChecklistItem: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  DeleteChecklistItem: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  ReorderChecklistItems: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  AddIconListItem: {
    SlideNotFoundError,
  },
  UpdateIconListItem: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  DeleteIconListItem: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  ReorderIconListItems: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  AddHighlight: {
    SlideNotFoundError,
  },
  UpdateHighlight: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  DeleteHighlight: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  ReorderHighlights: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
};
