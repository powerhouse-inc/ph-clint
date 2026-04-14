export type ErrorCode = "DuplicateAgentError" | "AgentNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class DuplicateAgentError extends Error implements ReducerError {
  errorCode = "DuplicateAgentError" as ErrorCode;
  constructor(message = "DuplicateAgentError") {
    super(message);
  }
}

export class AgentNotFoundError extends Error implements ReducerError {
  errorCode = "AgentNotFoundError" as ErrorCode;
  constructor(message = "AgentNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddAgent: { DuplicateAgentError },
  SetAgentName: { AgentNotFoundError },
  SetAgentEthAddress: { AgentNotFoundError },
  SetAgentRole: { AgentNotFoundError },
  SetAgentDescription: { AgentNotFoundError },
  SetAgentAvatar: { AgentNotFoundError },
  RemoveAgent: { AgentNotFoundError },
  ReaddAgent: { AgentNotFoundError },
};
