export type ErrorCode = "InvalidVersionError" | "InvalidPackageIdentifierError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class InvalidVersionError extends Error implements ReducerError {
  errorCode = "InvalidVersionError" as ErrorCode;
  constructor(message = "InvalidVersionError") {
    super(message);
  }
}

export class InvalidPackageIdentifierError
  extends Error
  implements ReducerError
{
  errorCode = "InvalidPackageIdentifierError" as ErrorCode;
  constructor(message = "InvalidPackageIdentifierError") {
    super(message);
  }
}

export const errors = {
  SetVersion: { InvalidVersionError },
  SetPackageIdentifier: { InvalidPackageIdentifierError },
};
