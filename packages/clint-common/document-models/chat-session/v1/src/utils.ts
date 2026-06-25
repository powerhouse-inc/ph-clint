import type { Message } from "../gen/types.js";

/**
 * A user message has content when it carries text or an attachment part.
 * Shared by the watcher's skip guard and the editor's responding derivation
 * so both agree on which messages start a turn.
 */
export function hasMessageContent(message: Pick<Message, "content">): boolean {
  return message.content.some(
    (p) =>
      (p.type === "TEXT" && !!p.text) ||
      p.type === "IMAGE" ||
      p.type === "FILE",
  );
}
