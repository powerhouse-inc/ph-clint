import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the Todo List document type */
export const AgentProjectsEditor: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/agent-projects"],
  config: {
    id: "agent-projects-editor",
    name: "AgentProjectsEditor",
  },
};
