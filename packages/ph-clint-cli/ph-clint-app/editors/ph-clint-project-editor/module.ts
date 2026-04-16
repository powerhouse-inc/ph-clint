import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the "["powerhouse/ph-clint-project"]" document type */
export const PhClintProjectEditor: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/ph-clint-project"],
  config: {
    id: "ph-clint-project-editor",
    name: "PhClintProjectEditor",
  },
};
