// TODO: remove eslint-disable rules once refactor is done
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { StateReducer } from "document-model";
import { isDocumentAction, createReducer } from "document-model/core";
import type { AgentInboxPHState } from "@powerhousedao/agent-manager/document-models/agent-inbox/v1";

import { agentInboxAgentOperations } from "../src/reducers/agent.js";
import { agentInboxStakeholdersOperations } from "../src/reducers/stakeholders.js";
import { agentInboxThreadsOperations } from "../src/reducers/threads.js";
import { agentInboxWorkflowOperations } from "../src/reducers/workflow.js";

import {
  SetAgentNameInputSchema,
  SetAgentAddressInputSchema,
  SetAgentRoleInputSchema,
  SetAgentDescriptionInputSchema,
  SetAgentAvatarInputSchema,
  AddStakeholderInputSchema,
  RemoveStakeholderInputSchema,
  SetStakeholderNameInputSchema,
  SetStakeholderAddressInputSchema,
  SetStakeholderAvatarInputSchema,
  MoveStakeholderInputSchema,
  CreateThreadInputSchema,
  SendAgentMessageInputSchema,
  SetThreadTopicInputSchema,
  EditMessageContentInputSchema,
  MarkMessageReadInputSchema,
  MarkMessageUnreadInputSchema,
  SendStakeholderMessageInputSchema,
  ProposeThreadResolvedInputSchema,
  ConfirmThreadResolvedInputSchema,
  ArchiveThreadInputSchema,
  ReopenThreadInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<AgentInboxPHState> = (
  state,
  action,
  dispatch,
) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case "SET_AGENT_NAME": {
      SetAgentNameInputSchema().parse(action.input);

      agentInboxAgentOperations.setAgentNameOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_AGENT_ADDRESS": {
      SetAgentAddressInputSchema().parse(action.input);

      agentInboxAgentOperations.setAgentAddressOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_AGENT_ROLE": {
      SetAgentRoleInputSchema().parse(action.input);

      agentInboxAgentOperations.setAgentRoleOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_AGENT_DESCRIPTION": {
      SetAgentDescriptionInputSchema().parse(action.input);

      agentInboxAgentOperations.setAgentDescriptionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_AGENT_AVATAR": {
      SetAgentAvatarInputSchema().parse(action.input);

      agentInboxAgentOperations.setAgentAvatarOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_STAKEHOLDER": {
      AddStakeholderInputSchema().parse(action.input);

      agentInboxStakeholdersOperations.addStakeholderOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REMOVE_STAKEHOLDER": {
      RemoveStakeholderInputSchema().parse(action.input);

      agentInboxStakeholdersOperations.removeStakeholderOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_STAKEHOLDER_NAME": {
      SetStakeholderNameInputSchema().parse(action.input);

      agentInboxStakeholdersOperations.setStakeholderNameOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_STAKEHOLDER_ADDRESS": {
      SetStakeholderAddressInputSchema().parse(action.input);

      agentInboxStakeholdersOperations.setStakeholderAddressOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_STAKEHOLDER_AVATAR": {
      SetStakeholderAvatarInputSchema().parse(action.input);

      agentInboxStakeholdersOperations.setStakeholderAvatarOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MOVE_STAKEHOLDER": {
      MoveStakeholderInputSchema().parse(action.input);

      agentInboxStakeholdersOperations.moveStakeholderOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "CREATE_THREAD": {
      CreateThreadInputSchema().parse(action.input);

      agentInboxThreadsOperations.createThreadOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SEND_AGENT_MESSAGE": {
      SendAgentMessageInputSchema().parse(action.input);

      agentInboxThreadsOperations.sendAgentMessageOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_THREAD_TOPIC": {
      SetThreadTopicInputSchema().parse(action.input);

      agentInboxThreadsOperations.setThreadTopicOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "EDIT_MESSAGE_CONTENT": {
      EditMessageContentInputSchema().parse(action.input);

      agentInboxThreadsOperations.editMessageContentOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MARK_MESSAGE_READ": {
      MarkMessageReadInputSchema().parse(action.input);

      agentInboxThreadsOperations.markMessageReadOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MARK_MESSAGE_UNREAD": {
      MarkMessageUnreadInputSchema().parse(action.input);

      agentInboxThreadsOperations.markMessageUnreadOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SEND_STAKEHOLDER_MESSAGE": {
      SendStakeholderMessageInputSchema().parse(action.input);

      agentInboxThreadsOperations.sendStakeholderMessageOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "PROPOSE_THREAD_RESOLVED": {
      ProposeThreadResolvedInputSchema().parse(action.input);

      agentInboxWorkflowOperations.proposeThreadResolvedOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "CONFIRM_THREAD_RESOLVED": {
      ConfirmThreadResolvedInputSchema().parse(action.input);

      agentInboxWorkflowOperations.confirmThreadResolvedOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ARCHIVE_THREAD": {
      ArchiveThreadInputSchema().parse(action.input);

      agentInboxWorkflowOperations.archiveThreadOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REOPEN_THREAD": {
      ReopenThreadInputSchema().parse(action.input);

      agentInboxWorkflowOperations.reopenThreadOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    default:
      return state;
  }
};

export const reducer = createReducer<AgentInboxPHState>(stateReducer);
