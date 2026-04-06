/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import {
  reducer,
  utils,
  setReferences,
  setMetaData,
} from "@powerhousedao/agent-manager/document-models/work-breakdown-structure";

describe("Metadata Operations", () => {
  describe("SET_REFERENCES", () => {
    it("should set references array", () => {
      const document = utils.createDocument();

      const updatedDocument = reducer(
        document,
        setReferences({
          references: [
            "https://example.com/doc1",
            "https://example.com/doc2",
            "https://example.com/doc3",
          ],
        }),
      );

      expect(updatedDocument.state.global.references).toHaveLength(3);
      expect(updatedDocument.state.global.references[0]).toBe(
        "https://example.com/doc1",
      );
      expect(updatedDocument.state.global.references[1]).toBe(
        "https://example.com/doc2",
      );
      expect(updatedDocument.state.global.references[2]).toBe(
        "https://example.com/doc3",
      );
    });

    it("should replace existing references", () => {
      const document = utils.createDocument();

      // Set initial references
      let updatedDocument = reducer(
        document,
        setReferences({
          references: ["https://example.com/old1", "https://example.com/old2"],
        }),
      );

      // Replace with new references
      updatedDocument = reducer(
        updatedDocument,
        setReferences({
          references: ["https://example.com/new1"],
        }),
      );

      expect(updatedDocument.state.global.references).toHaveLength(1);
      expect(updatedDocument.state.global.references[0]).toBe(
        "https://example.com/new1",
      );
    });

    it("should set empty references array", () => {
      const document = utils.createDocument();

      // Set some references first
      let updatedDocument = reducer(
        document,
        setReferences({
          references: ["https://example.com/doc1"],
        }),
      );

      // Clear references
      updatedDocument = reducer(
        updatedDocument,
        setReferences({
          references: [],
        }),
      );

      expect(updatedDocument.state.global.references).toHaveLength(0);
    });
  });

  describe("SET_META_DATA", () => {
    it("should set metadata with JSON format", () => {
      const document = utils.createDocument();

      const updatedDocument = reducer(
        document,
        setMetaData({
          format: "JSON",
          data: '{"key": "value", "count": 42}',
        }),
      );

      expect(updatedDocument.state.global.metaData).toBeDefined();
      expect(updatedDocument.state.global.metaData?.format).toBe("JSON");
      expect(updatedDocument.state.global.metaData?.data).toBe(
        '{"key": "value", "count": 42}',
      );
    });

    it("should set metadata with TEXT format", () => {
      const document = utils.createDocument();

      const updatedDocument = reducer(
        document,
        setMetaData({
          format: "TEXT",
          data: "This is plain text metadata",
        }),
      );

      expect(updatedDocument.state.global.metaData).toBeDefined();
      expect(updatedDocument.state.global.metaData?.format).toBe("TEXT");
      expect(updatedDocument.state.global.metaData?.data).toBe(
        "This is plain text metadata",
      );
    });

    it("should update existing metadata", () => {
      const document = utils.createDocument();

      // Set initial metadata
      let updatedDocument = reducer(
        document,
        setMetaData({
          format: "JSON",
          data: '{"version": 1}',
        }),
      );

      // Update metadata
      updatedDocument = reducer(
        updatedDocument,
        setMetaData({
          format: "TEXT",
          data: "Updated to text format",
        }),
      );

      expect(updatedDocument.state.global.metaData?.format).toBe("TEXT");
      expect(updatedDocument.state.global.metaData?.data).toBe(
        "Updated to text format",
      );
    });

    it("should handle OTHER format", () => {
      const document = utils.createDocument();

      const updatedDocument = reducer(
        document,
        setMetaData({
          format: "OTHER",
          data: "Custom format data",
        }),
      );

      expect(updatedDocument.state.global.metaData?.format).toBe("OTHER");
      expect(updatedDocument.state.global.metaData?.data).toBe(
        "Custom format data",
      );
    });
  });
});
