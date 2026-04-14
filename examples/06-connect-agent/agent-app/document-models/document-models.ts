import type { DocumentModelModule } from "document-model";
import { AgentChat as AgentChatV1 } from "./agent-chat/v1/module.js";

export const documentModels: DocumentModelModule<any>[] = [AgentChatV1];
