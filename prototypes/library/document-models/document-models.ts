import type { DocumentModelModule } from "document-model";
import { AchraPresentation } from "./achra-presentation/v1/module.js";
import { AgentInbox } from "./agent-inbox/v1/module.js";
import { AgentProjects } from "./agent-projects/v1/module.js";
import { ClaudeChat } from "./claude-chat/v1/module.js";
import { WorkBreakdownStructure } from "./work-breakdown-structure/v1/module.js";

export const documentModels: DocumentModelModule<any>[] = [
  AchraPresentation,
  AgentInbox,
  AgentProjects,
  ClaudeChat,
  WorkBreakdownStructure,
];
