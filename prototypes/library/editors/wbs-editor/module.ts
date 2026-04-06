import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the Todo List document type */
export const WbsEditor: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/work-breakdown-structure"],
  config: {
    id: "wbs-editor",
    name: "WBS Editor",
  },
};
