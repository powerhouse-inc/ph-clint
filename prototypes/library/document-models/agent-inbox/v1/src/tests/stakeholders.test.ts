/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateId } from "document-model/core";
import {
  reducer,
  utils,
  isAgentInboxDocument,
  addStakeholder,
  AddStakeholderInputSchema,
  removeStakeholder,
  RemoveStakeholderInputSchema,
  setStakeholderName,
  SetStakeholderNameInputSchema,
  setStakeholderAddress,
  SetStakeholderAddressInputSchema,
  setStakeholderAvatar,
  SetStakeholderAvatarInputSchema,
  moveStakeholder,
  MoveStakeholderInputSchema,
  createThread,
} from "@powerhousedao/agent-manager/document-models/agent-inbox";

describe("Stakeholders Operations", () => {
  it("should handle addStakeholder operation", () => {
    const document = utils.createDocument();
    const stakeholderId = generateId();
    const input = {
      id: stakeholderId,
      name: "Bob Stakeholder",
      ethAddress: "0x1234567890123456789012345678901234567890",
      avatar: "https://example.com/bob.png",
    };

    const updatedDocument = reducer(document, addStakeholder(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_STAKEHOLDER",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);

    // Test actual state change
    expect(updatedDocument.state.global.stakeholders).toHaveLength(1);
    expect(updatedDocument.state.global.stakeholders[0]).toEqual({
      id: stakeholderId,
      name: "Bob Stakeholder",
      ethAddress: "0x1234567890123456789012345678901234567890",
      avatar: "https://example.com/bob.png",
      removed: false,
    });
  });

  it("should reject duplicate stakeholder ID", () => {
    const document = utils.createDocument();
    const stakeholderId = generateId();
    const input1 = {
      id: stakeholderId,
      name: "Bob Stakeholder",
      ethAddress: null,
      avatar: null,
    };

    // Add first stakeholder
    const doc1 = reducer(document, addStakeholder(input1));

    // Try to add duplicate
    const input2 = {
      id: stakeholderId, // Same ID
      name: "Alice Stakeholder",
      ethAddress: null,
      avatar: null,
    };

    const doc2 = reducer(doc1, addStakeholder(input2));

    // Check that the operation failed with error
    expect(doc2.operations.global).toHaveLength(2);
    const lastOp = doc2.operations.global[1];
    expect(lastOp.error).toBeDefined();
    expect(lastOp.error).toContain("Stakeholder with ID");
    expect(lastOp.error).toContain(stakeholderId);
    expect(lastOp.error).toContain("already exists");

    // State should remain unchanged
    expect(doc2.state.global.stakeholders).toHaveLength(1);
  });
  it("should handle removeStakeholder operation", () => {
    const document = utils.createDocument();
    const stakeholderId = generateId();

    // First add a stakeholder
    const addInput = {
      id: stakeholderId,
      name: "Bob Stakeholder",
      ethAddress: null,
      avatar: null,
    };
    const doc1 = reducer(document, addStakeholder(addInput));

    // Now remove it
    const removeInput = { id: stakeholderId };
    const updatedDocument = reducer(doc1, removeStakeholder(removeInput));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(2);
    expect(updatedDocument.operations.global[1].action.type).toBe(
      "REMOVE_STAKEHOLDER",
    );

    // Check soft delete - stakeholder still exists but marked as removed
    expect(updatedDocument.state.global.stakeholders).toHaveLength(1);
    expect(updatedDocument.state.global.stakeholders[0].removed).toBe(true);
  });

  it("should error when removing non-existent stakeholder", () => {
    const document = utils.createDocument();
    const nonExistentId = generateId();
    const input = { id: nonExistentId };

    const updatedDocument = reducer(document, removeStakeholder(input));

    // Check for error in operation
    const lastOp = updatedDocument.operations.global[0];
    expect(lastOp.error).toBeDefined();
    expect(lastOp.error).toContain("Stakeholder with ID");
    expect(lastOp.error).toContain(nonExistentId);
    expect(lastOp.error).toContain("not found");
  });
  it("should handle setStakeholderName operation", () => {
    const document = utils.createDocument();
    const stakeholderId = generateId();

    // First add a stakeholder
    const addInput = {
      id: stakeholderId,
      name: "Old Name",
      ethAddress: null,
      avatar: null,
    };
    const doc1 = reducer(document, addStakeholder(addInput));

    // Update the name
    const updateInput = {
      id: stakeholderId,
      name: "New Name",
    };
    const updatedDocument = reducer(doc1, setStakeholderName(updateInput));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global[1].action.type).toBe(
      "SET_STAKEHOLDER_NAME",
    );

    // Check state change
    expect(updatedDocument.state.global.stakeholders[0].name).toBe("New Name");
  });

  it("should error when updating name of non-existent stakeholder", () => {
    const document = utils.createDocument();
    const nonExistentId = generateId();
    const input = {
      id: nonExistentId,
      name: "New Name",
    };

    const updatedDocument = reducer(document, setStakeholderName(input));

    const lastOp = updatedDocument.operations.global[0];
    expect(lastOp.error).toBeDefined();
    expect(lastOp.error).toContain("Stakeholder with ID");
    expect(lastOp.error).toContain(nonExistentId);
    expect(lastOp.error).toContain("not found");
  });
  it("should handle setStakeholderAddress operation", () => {
    const document = utils.createDocument();
    const stakeholderId = generateId();

    // First add a stakeholder
    const addInput = {
      id: stakeholderId,
      name: "Bob",
      ethAddress: "0xOLD",
      avatar: null,
    };
    const doc1 = reducer(document, addStakeholder(addInput));

    // Update the address
    const updateInput = {
      id: stakeholderId,
      ethAddress: "0xNEW",
    };
    const updatedDocument = reducer(doc1, setStakeholderAddress(updateInput));

    expect(updatedDocument.state.global.stakeholders[0].ethAddress).toBe(
      "0xNEW",
    );
  });

  it("should clear stakeholder address when null provided", () => {
    const document = utils.createDocument();
    const stakeholderId = generateId();

    // First add a stakeholder with address
    const addInput = {
      id: stakeholderId,
      name: "Bob",
      ethAddress: "0xADDRESS",
      avatar: null,
    };
    const doc1 = reducer(document, addStakeholder(addInput));

    // Clear the address
    const updateInput = {
      id: stakeholderId,
      ethAddress: null,
    };
    const updatedDocument = reducer(doc1, setStakeholderAddress(updateInput));

    expect(updatedDocument.state.global.stakeholders[0].ethAddress).toBeNull();
  });
  it("should handle setStakeholderAvatar operation", () => {
    const document = utils.createDocument();
    const stakeholderId = generateId();

    // First add a stakeholder
    const addInput = {
      id: stakeholderId,
      name: "Bob",
      ethAddress: null,
      avatar: "https://old.com/avatar.png",
    };
    const doc1 = reducer(document, addStakeholder(addInput));

    // Update the avatar
    const updateInput = {
      id: stakeholderId,
      avatar: "https://new.com/avatar.png",
    };
    const updatedDocument = reducer(doc1, setStakeholderAvatar(updateInput));

    expect(updatedDocument.state.global.stakeholders[0].avatar).toBe(
      "https://new.com/avatar.png",
    );
  });

  it("should clear stakeholder avatar when null provided", () => {
    const document = utils.createDocument();
    const stakeholderId = generateId();

    // First add a stakeholder with avatar
    const addInput = {
      id: stakeholderId,
      name: "Bob",
      ethAddress: null,
      avatar: "https://example.com/avatar.png",
    };
    const doc1 = reducer(document, addStakeholder(addInput));

    // Clear the avatar
    const updateInput = {
      id: stakeholderId,
      avatar: null,
    };
    const updatedDocument = reducer(doc1, setStakeholderAvatar(updateInput));

    expect(updatedDocument.state.global.stakeholders[0].avatar).toBeNull();
  });
  it("should handle moveStakeholder operation", () => {
    const document = utils.createDocument();
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();

    // Add three stakeholders
    let doc = reducer(
      document,
      addStakeholder({
        id: id1,
        name: "Alice",
        ethAddress: null,
        avatar: null,
      }),
    );
    doc = reducer(
      doc,
      addStakeholder({ id: id2, name: "Bob", ethAddress: null, avatar: null }),
    );
    doc = reducer(
      doc,
      addStakeholder({
        id: id3,
        name: "Charlie",
        ethAddress: null,
        avatar: null,
      }),
    );

    // Move Charlie before Alice
    const moveInput = {
      id: id3,
      insertBefore: id1,
    };
    const updatedDocument = reducer(doc, moveStakeholder(moveInput));

    // Check new order: Charlie, Alice, Bob
    expect(updatedDocument.state.global.stakeholders[0].name).toBe("Charlie");
    expect(updatedDocument.state.global.stakeholders[1].name).toBe("Alice");
    expect(updatedDocument.state.global.stakeholders[2].name).toBe("Bob");
  });

  it("should move stakeholder to end when insertBefore is omitted", () => {
    const document = utils.createDocument();
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();

    // Add three stakeholders
    let doc = reducer(
      document,
      addStakeholder({
        id: id1,
        name: "Alice",
        ethAddress: null,
        avatar: null,
      }),
    );
    doc = reducer(
      doc,
      addStakeholder({ id: id2, name: "Bob", ethAddress: null, avatar: null }),
    );
    doc = reducer(
      doc,
      addStakeholder({
        id: id3,
        name: "Charlie",
        ethAddress: null,
        avatar: null,
      }),
    );

    // Move Alice to end (omit insertBefore)
    const moveInput = {
      id: id1,
      // insertBefore omitted
    };
    const updatedDocument = reducer(doc, moveStakeholder(moveInput));

    // Check new order: Bob, Charlie, Alice
    expect(updatedDocument.state.global.stakeholders[0].name).toBe("Bob");
    expect(updatedDocument.state.global.stakeholders[1].name).toBe("Charlie");
    expect(updatedDocument.state.global.stakeholders[2].name).toBe("Alice");
  });

  it("should error when moving non-existent stakeholder", () => {
    const document = utils.createDocument();
    const nonExistentId = generateId();
    const input = {
      id: nonExistentId,
      // insertBefore omitted
    };

    const updatedDocument = reducer(document, moveStakeholder(input));

    const lastOp = updatedDocument.operations.global[0];
    expect(lastOp.error).toBeDefined();
    expect(lastOp.error).toContain("Stakeholder with ID");
    expect(lastOp.error).toContain(nonExistentId);
    expect(lastOp.error).toContain("not found");
  });

  it("should auto-archive all threads when stakeholder is removed", () => {
    const document = utils.createDocument();
    const stakeholderId = generateId();
    const threadId1 = generateId();
    const threadId2 = generateId();
    const messageId1 = generateId();
    const messageId2 = generateId();

    // First add a stakeholder
    const addInput = {
      id: stakeholderId,
      name: "Test Stakeholder",
      ethAddress: null,
      avatar: null,
    };
    let doc = reducer(document, addStakeholder(addInput));

    // Create two threads for this stakeholder
    const thread1Input = {
      id: threadId1,
      stakeholder: stakeholderId,
      topic: "Thread 1",
      initialMessage: {
        id: messageId1,
        flow: "Incoming" as const,
        when: new Date().toISOString(),
        content: "First thread message",
      },
    };
    doc = reducer(doc, createThread(thread1Input));

    const thread2Input = {
      id: threadId2,
      stakeholder: stakeholderId,
      topic: "Thread 2",
      initialMessage: {
        id: messageId2,
        flow: "Incoming" as const,
        when: new Date().toISOString(),
        content: "Second thread message",
      },
    };
    doc = reducer(doc, createThread(thread2Input));

    // Verify threads are created with Open status
    expect(doc.state.global.threads).toHaveLength(2);
    expect(doc.state.global.threads[0].status).toBe("Open");
    expect(doc.state.global.threads[1].status).toBe("Open");

    // Now remove the stakeholder
    const removeInput = { id: stakeholderId };
    const updatedDocument = reducer(doc, removeStakeholder(removeInput));

    // Check that stakeholder is marked as removed
    expect(updatedDocument.state.global.stakeholders[0].removed).toBe(true);

    // Check that all threads are automatically archived
    expect(updatedDocument.state.global.threads[0].status).toBe("Archived");
    expect(updatedDocument.state.global.threads[1].status).toBe("Archived");
  });
});
