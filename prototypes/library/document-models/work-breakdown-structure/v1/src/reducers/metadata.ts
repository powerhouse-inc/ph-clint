import type { WorkBreakdownStructureMetadataOperations } from "@powerhousedao/agent-manager/document-models/work-breakdown-structure/v1";

export const workBreakdownStructureMetadataOperations: WorkBreakdownStructureMetadataOperations =
  {
    setReferencesOperation(state, action) {
      // Update state.references array
      state.references = action.input.references;
    },
    setMetaDataOperation(state, action) {
      // Create/update state.metaData object
      if (!state.metaData) {
        state.metaData = {
          format: action.input.format,
          data: action.input.data,
        };
      } else {
        // Update existing metadata
        state.metaData.format = action.input.format;
        state.metaData.data = action.input.data;
      }
    },
  };
