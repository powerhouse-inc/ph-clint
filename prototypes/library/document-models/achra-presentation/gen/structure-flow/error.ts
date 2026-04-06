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
  AddProcessStep: {
    SlideNotFoundError,
  },
  UpdateProcessStep: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  DeleteProcessStep: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  ReorderProcessSteps: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  AddAgendaItem: {
    SlideNotFoundError,
  },
  UpdateAgendaItem: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  DeleteAgendaItem: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  ReorderAgendaItems: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  AddMilestone: {
    SlideNotFoundError,
  },
  UpdateMilestone: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  DeleteMilestone: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
  ReorderMilestones: {
    SlideNotFoundError,
    ItemNotFoundError,
  },
};
