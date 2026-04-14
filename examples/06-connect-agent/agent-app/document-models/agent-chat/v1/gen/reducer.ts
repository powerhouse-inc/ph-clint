/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Reducer, StateReducer } from "document-model";
import { isDocumentAction, createReducer } from "document-model";
import type { AgentChatPHState } from "document-models/agent-chat/v1";

import { agentChatBaseOperations } from "../src/reducers/base.js";
import { agentChatStakeholdersOperations } from "../src/reducers/stakeholders.js";
import { agentChatAgentsOperations } from "../src/reducers/agents.js";
import { agentChatMessagesOperations } from "../src/reducers/messages.js";
import { agentChatReactionsOperations } from "../src/reducers/reactions.js";

import {
  SetTopicInputSchema,
  ClearTopicInputSchema,
  SetPruneLengthInputSchema,
  RemovePruneLengthInputSchema,
  AddStakeholderInputSchema,
  SetStakeholderNameInputSchema,
  SetStakeholderEthAddressInputSchema,
  SetStakeholderAvatarInputSchema,
  RemoveStakeholderInputSchema,
  ReaddStakeholderInputSchema,
  AddAgentInputSchema,
  SetAgentNameInputSchema,
  SetAgentEthAddressInputSchema,
  SetAgentRoleInputSchema,
  SetAgentDescriptionInputSchema,
  SetAgentAvatarInputSchema,
  RemoveAgentInputSchema,
  ReaddAgentInputSchema,
  SendTextInputSchema,
  SendErrorInputSchema,
  SendToolCallInputSchema,
  SendToolResultInputSchema,
  DeleteMessageInputSchema,
  MarkAsReadInputSchema,
  AddReactionInputSchema,
  RemoveReactionInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<AgentChatPHState> = (
  state,
  action,
  dispatch,
) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case "SET_TOPIC": {
      SetTopicInputSchema().parse(action.input);

      agentChatBaseOperations.setTopicOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "CLEAR_TOPIC": {
      ClearTopicInputSchema().parse(action.input);

      agentChatBaseOperations.clearTopicOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_PRUNE_LENGTH": {
      SetPruneLengthInputSchema().parse(action.input);

      agentChatBaseOperations.setPruneLengthOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REMOVE_PRUNE_LENGTH": {
      RemovePruneLengthInputSchema().parse(action.input);

      agentChatBaseOperations.removePruneLengthOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_STAKEHOLDER": {
      AddStakeholderInputSchema().parse(action.input);

      agentChatStakeholdersOperations.addStakeholderOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_STAKEHOLDER_NAME": {
      SetStakeholderNameInputSchema().parse(action.input);

      agentChatStakeholdersOperations.setStakeholderNameOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_STAKEHOLDER_ETH_ADDRESS": {
      SetStakeholderEthAddressInputSchema().parse(action.input);

      agentChatStakeholdersOperations.setStakeholderEthAddressOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_STAKEHOLDER_AVATAR": {
      SetStakeholderAvatarInputSchema().parse(action.input);

      agentChatStakeholdersOperations.setStakeholderAvatarOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REMOVE_STAKEHOLDER": {
      RemoveStakeholderInputSchema().parse(action.input);

      agentChatStakeholdersOperations.removeStakeholderOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "READD_STAKEHOLDER": {
      ReaddStakeholderInputSchema().parse(action.input);

      agentChatStakeholdersOperations.readdStakeholderOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_AGENT": {
      AddAgentInputSchema().parse(action.input);

      agentChatAgentsOperations.addAgentOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_AGENT_NAME": {
      SetAgentNameInputSchema().parse(action.input);

      agentChatAgentsOperations.setAgentNameOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_AGENT_ETH_ADDRESS": {
      SetAgentEthAddressInputSchema().parse(action.input);

      agentChatAgentsOperations.setAgentEthAddressOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_AGENT_ROLE": {
      SetAgentRoleInputSchema().parse(action.input);

      agentChatAgentsOperations.setAgentRoleOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_AGENT_DESCRIPTION": {
      SetAgentDescriptionInputSchema().parse(action.input);

      agentChatAgentsOperations.setAgentDescriptionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_AGENT_AVATAR": {
      SetAgentAvatarInputSchema().parse(action.input);

      agentChatAgentsOperations.setAgentAvatarOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REMOVE_AGENT": {
      RemoveAgentInputSchema().parse(action.input);

      agentChatAgentsOperations.removeAgentOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "READD_AGENT": {
      ReaddAgentInputSchema().parse(action.input);

      agentChatAgentsOperations.readdAgentOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SEND_TEXT": {
      SendTextInputSchema().parse(action.input);

      agentChatMessagesOperations.sendTextOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SEND_ERROR": {
      SendErrorInputSchema().parse(action.input);

      agentChatMessagesOperations.sendErrorOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SEND_TOOL_CALL": {
      SendToolCallInputSchema().parse(action.input);

      agentChatMessagesOperations.sendToolCallOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SEND_TOOL_RESULT": {
      SendToolResultInputSchema().parse(action.input);

      agentChatMessagesOperations.sendToolResultOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DELETE_MESSAGE": {
      DeleteMessageInputSchema().parse(action.input);

      agentChatMessagesOperations.deleteMessageOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MARK_AS_READ": {
      MarkAsReadInputSchema().parse(action.input);

      agentChatMessagesOperations.markAsReadOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_REACTION": {
      AddReactionInputSchema().parse(action.input);

      agentChatReactionsOperations.addReactionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REMOVE_REACTION": {
      RemoveReactionInputSchema().parse(action.input);

      agentChatReactionsOperations.removeReactionOperation(
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

export const reducer: Reducer<AgentChatPHState> = createReducer(stateReducer);
