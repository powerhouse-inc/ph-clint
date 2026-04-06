import type { EditorModule } from "document-model";
import { ClaudeChatEditor } from "./claude-chat-editor/module.js";
import { AgentProjectsEditor } from "./agent-projects-editor/module.js";
import { WbsEditor } from "./wbs-editor/module.js";
import { AgentInboxEditor } from "./agent-inbox-editor/module.js";
import { AchraPresentationEditor } from "./achra-presentation-editor/module.js";

export const editors: EditorModule[] = [
  AchraPresentationEditor,
  AgentInboxEditor,
  AgentProjectsEditor,
  ClaudeChatEditor,
  WbsEditor,
];
