import type { PhClintProjectPowerhousePackagesOperations } from 'document-models/ph-clint-project/v1';
import { CannotRemoveManagedPackageError, DocumentTypeNotFoundError, DuplicateDocumentTypeError, DuplicatePackageError, InvalidDocumentTypeError, InvalidVersionError, PackageNotFoundError } from '../../gen/powerhouse-packages/error.js';

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export const phClintProjectPowerhousePackagesOperations: PhClintProjectPowerhousePackagesOperations = {
  addPowerhousePackageOperation(state, action) {
    const exists = state.packages.find((p) => p.id === action.input.id || p.packageName === action.input.packageName);
    if (exists) {
      throw new DuplicatePackageError(`Package already exists: ${action.input.packageName}`);
    }
    state.packages.push({
      id: action.input.id,
      packageName: action.input.packageName,
      documentTypes: [],
      version: null,
      managed: false,
    });
  },
  removePowerhousePackageOperation(state, action) {
    const idx = state.packages.findIndex((p) => p.id === action.input.id);
    if (idx === -1) {
      throw new PackageNotFoundError(`Package not found: ${action.input.id}`);
    }
    const pkg = state.packages[idx];
    if (pkg.managed) {
      throw new CannotRemoveManagedPackageError('Cannot remove a managed package');
    }
    state.packages.splice(idx, 1);
  },
  addPackageDocumentTypeOperation(state, action) {
    if (action.input.documentType !== '*/*' && !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(action.input.documentType)) {
      throw new InvalidDocumentTypeError(`Invalid document type format: ${action.input.documentType}. Expected org/name.`);
    }
    const pkg = state.packages.find((p) => p.id === action.input.packageId);
    if (!pkg) {
      throw new PackageNotFoundError(`Package not found: ${action.input.packageId}`);
    }
    if (action.input.documentType === '*/*') {
      pkg.documentTypes.length = 0;
      pkg.documentTypes.push('*/*');
      return;
    }
    if (pkg.documentTypes.includes('*/*')) {
      return;
    }
    if (pkg.documentTypes.includes(action.input.documentType)) {
      throw new DuplicateDocumentTypeError(`Document type already registered: ${action.input.documentType}`);
    }
    pkg.documentTypes.push(action.input.documentType);
  },
  removePackageDocumentTypeOperation(state, action) {
    const pkg = state.packages.find((p) => p.id === action.input.packageId);
    if (!pkg) {
      throw new PackageNotFoundError(`Package not found: ${action.input.packageId}`);
    }
    const idx = pkg.documentTypes.indexOf(action.input.documentType);
    if (idx === -1) {
      throw new DocumentTypeNotFoundError(`Document type not found: ${action.input.documentType}`);
    }
    pkg.documentTypes.splice(idx, 1);
  },
  setPackageVersionOperation(state, action) {
    const pkg = state.packages.find((p) => p.id === action.input.packageId);
    if (!pkg) {
      throw new PackageNotFoundError(`Package not found: ${action.input.packageId}`);
    }
    if (action.input.version != null) {
      if (!SEMVER.test(action.input.version)) {
        throw new InvalidVersionError(`Invalid version: ${action.input.version}`);
      }
    }
    pkg.version = action.input.version || null;
  },
};
