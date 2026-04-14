import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the "["powerhouse/agent-chat"]" document type */
export const AgentChatEditor: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/agent-chat"],
  config: {
    id: "agent-chat-editor",
    name: "Agent Chat Editor",
  },
};
