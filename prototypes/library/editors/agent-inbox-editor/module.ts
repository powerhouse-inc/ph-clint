import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the Todo List document type */
export const AgentInboxEditor: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/agent-inbox"],
  config: {
    id: "agent-inbox-editor",
    name: "Agent Inbox Editor",
  },
};
