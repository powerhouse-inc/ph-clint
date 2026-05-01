import {
  InvalidVersionError,
  PublishRecordNotFoundError,
} from "../../gen/publishing/error.js";
import type { PhClintProjectPublishingOperations } from "document-models/ph-clint-project/v1";

export const phClintProjectPublishingOperations: PhClintProjectPublishingOperations =
  {
    bumpVersionOperation(state, action) {
      if (
        !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
          action.input.version,
        )
      ) {
        throw new InvalidVersionError(
          `Invalid version: ${action.input.version}`,
        );
      }
      state.version = action.input.version;
    },
    publishDevOperation(state, action) {
      state.publishHistory.push({
        id: action.input.id,
        tag: "Dev",
        version: state.version,
        timestamp: action.input.timestamp,
        status: "Pending",
      });
    },
    publishStagingOperation(state, action) {
      state.publishHistory.push({
        id: action.input.id,
        tag: "Staging",
        version: state.version,
        timestamp: action.input.timestamp,
        status: "Pending",
      });
    },
    publishProductionOperation(state, action) {
      state.publishHistory.push({
        id: action.input.id,
        tag: "Production",
        version: state.version,
        timestamp: action.input.timestamp,
        status: "Pending",
      });
    },
    setPublishStatusOperation(state, action) {
      const record = state.publishHistory.find((r) => r.id === action.input.id);
      if (!record) {
        throw new PublishRecordNotFoundError(
          `Publish record not found: ${action.input.id}`,
        );
      }
      record.status = action.input.status;
    },
  };
