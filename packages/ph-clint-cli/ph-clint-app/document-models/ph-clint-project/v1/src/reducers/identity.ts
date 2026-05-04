import {
  InvalidVersionError,
  InvalidPackageIdentifierError,
} from "../../gen/identity/error.js";
import type { PhClintProjectIdentityOperations } from "document-models/ph-clint-project/v1";

const SEMVER_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

export const phClintProjectIdentityOperations: PhClintProjectIdentityOperations =
  {
    setVersionOperation(state, action) {
      if (!SEMVER_PATTERN.test(action.input.version)) {
        throw new InvalidVersionError(
          `Invalid version: ${action.input.version}`,
        );
      }
      state.version = action.input.version;
    },
    setDescriptionOperation(state, action) {
      state.description = action.input.description;
    },
    setPackageIdentifierOperation(state, action) {
      const trimmed = action.input.identifier.trim();
      if (!trimmed) {
        throw new InvalidPackageIdentifierError(
          "Package identifier must not be empty",
        );
      }
      let scopePart: string | null = null;
      let namePart = trimmed;
      if (trimmed.includes("/")) {
        const parts = trimmed.split("/");
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
          throw new InvalidPackageIdentifierError(
            `Invalid package identifier: ${trimmed}`,
          );
        }
        scopePart = parts[0].replace(/^@/, "");
        namePart = parts[1];
      }
      if (scopePart !== null) {
        if (!NAME_PATTERN.test(scopePart)) {
          throw new InvalidPackageIdentifierError(
            `Invalid scope: ${scopePart}`,
          );
        }
      }
      if (!namePart.endsWith("-cli")) {
        namePart = namePart + "-cli";
      }
      if (!NAME_PATTERN.test(namePart)) {
        throw new InvalidPackageIdentifierError(
          `Invalid package name: ${namePart}`,
        );
      }
      state.scope = scopePart ? `@${scopePart}` : null;
      state.name = namePart;
      // Update managed app package name to match new identity
      const managed = state.packages.find((p) => p.managed);
      if (managed) {
        const appBase = namePart.replace(/-cli$/, "-app");
        managed.packageName = scopePart ? `@${scopePart}/${appBase}` : appBase;
        managed.id = `app-${namePart}`;
      }
    },
  };
