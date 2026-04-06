import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the Todo List document type */
export const AchraPresentationEditor: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["achra/presentation"],
  config: {
    id: "achra-presentation-editor",
    name: "Achra Presentation Editor",
  },
};
