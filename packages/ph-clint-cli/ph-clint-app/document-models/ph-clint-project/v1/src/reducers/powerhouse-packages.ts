import {
  DuplicatePackageError,
  PackageNotFoundError,
  CannotRemoveAppPackageError,
  InvalidDocumentTypeError,
  DuplicateDocumentTypeError,
  DocumentTypeNotFoundError,
} from "../../gen/powerhouse-packages/error.js";
import type { PhClintProjectPowerhousePackagesOperations } from "document-models/ph-clint-project/v1";

export const phClintProjectPowerhousePackagesOperations: PhClintProjectPowerhousePackagesOperations =
  {
    addPowerhousePackageOperation(state, action) {
      const exists = state.packages.find(
        (p) =>
          p.id === action.input.id ||
          p.packageName === action.input.packageName,
      );
      if (exists) {
        throw new DuplicatePackageError(
          `Package already exists: ${action.input.packageName}`,
        );
      }
      state.packages.push({
        id: action.input.id,
        packageName: action.input.packageName,
        documentTypes: [],
      });
    },
    removePowerhousePackageOperation(state, action) {
      const idx = state.packages.findIndex((p) => p.id === action.input.id);
      if (idx === -1) {
        throw new PackageNotFoundError(`Package not found: ${action.input.id}`);
      }
      const pkg = state.packages[idx];
      const appName = state.name ? state.name.replace(/-cli$/, "-app") : null;
      const fullAppName =
        appName && state.scope ? `${state.scope}/${appName}` : appName;
      if (pkg.packageName === fullAppName) {
        throw new CannotRemoveAppPackageError(
          "Cannot remove the auto-managed app package",
        );
      }
      state.packages.splice(idx, 1);
    },
    addPackageDocumentTypeOperation(state, action) {
      if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(action.input.documentType)) {
        throw new InvalidDocumentTypeError(
          `Invalid document type format: ${action.input.documentType}. Expected org/name.`,
        );
      }
      const pkg = state.packages.find((p) => p.id === action.input.packageId);
      if (!pkg) {
        throw new PackageNotFoundError(
          `Package not found: ${action.input.packageId}`,
        );
      }
      if (pkg.documentTypes.includes(action.input.documentType)) {
        throw new DuplicateDocumentTypeError(
          `Document type already registered: ${action.input.documentType}`,
        );
      }
      pkg.documentTypes.push(action.input.documentType);
    },
    removePackageDocumentTypeOperation(state, action) {
      const pkg = state.packages.find((p) => p.id === action.input.packageId);
      if (!pkg) {
        throw new PackageNotFoundError(
          `Package not found: ${action.input.packageId}`,
        );
      }
      const idx = pkg.documentTypes.indexOf(action.input.documentType);
      if (idx === -1) {
        throw new DocumentTypeNotFoundError(
          `Document type not found: ${action.input.documentType}`,
        );
      }
      pkg.documentTypes.splice(idx, 1);
    },
  };
