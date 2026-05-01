export type ErrorCode =
  | "DuplicatePackageError"
  | "PackageNotFoundError"
  | "CannotRemoveAppPackageError"
  | "InvalidDocumentTypeError"
  | "DuplicateDocumentTypeError"
  | "DocumentTypeNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class DuplicatePackageError extends Error implements ReducerError {
  errorCode = "DuplicatePackageError" as ErrorCode;
  constructor(message = "DuplicatePackageError") {
    super(message);
  }
}

export class PackageNotFoundError extends Error implements ReducerError {
  errorCode = "PackageNotFoundError" as ErrorCode;
  constructor(message = "PackageNotFoundError") {
    super(message);
  }
}

export class CannotRemoveAppPackageError extends Error implements ReducerError {
  errorCode = "CannotRemoveAppPackageError" as ErrorCode;
  constructor(message = "CannotRemoveAppPackageError") {
    super(message);
  }
}

export class InvalidDocumentTypeError extends Error implements ReducerError {
  errorCode = "InvalidDocumentTypeError" as ErrorCode;
  constructor(message = "InvalidDocumentTypeError") {
    super(message);
  }
}

export class DuplicateDocumentTypeError extends Error implements ReducerError {
  errorCode = "DuplicateDocumentTypeError" as ErrorCode;
  constructor(message = "DuplicateDocumentTypeError") {
    super(message);
  }
}

export class DocumentTypeNotFoundError extends Error implements ReducerError {
  errorCode = "DocumentTypeNotFoundError" as ErrorCode;
  constructor(message = "DocumentTypeNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddPowerhousePackage: { DuplicatePackageError },
  RemovePowerhousePackage: {
    PackageNotFoundError,
    CannotRemoveAppPackageError,
  },
  AddPackageDocumentType: {
    InvalidDocumentTypeError,
    PackageNotFoundError,
    DuplicateDocumentTypeError,
  },
  RemovePackageDocumentType: {
    PackageNotFoundError,
    DocumentTypeNotFoundError,
  },
};
