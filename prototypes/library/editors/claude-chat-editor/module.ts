import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the Todo List document type */
export const ClaudeChatEditor: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/claude-chat"],
  config: {
    id: "claude-chat-editor",
    name: "Claude Chat Editor",
  },
};
