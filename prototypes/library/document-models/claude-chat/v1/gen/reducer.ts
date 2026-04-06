// TODO: remove eslint-disable rules once refactor is done
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { StateReducer } from "document-model";
import { isDocumentAction, createReducer } from "document-model/core";
import type { ClaudeChatPHState } from "@powerhousedao/agent-manager/document-models/claude-chat/v1";

import { claudeChatAgentsOperations } from "../src/reducers/agents.js";
import { claudeChatMessagesOperations } from "../src/reducers/messages.js";
import { claudeChatUserOperations } from "../src/reducers/user.js";

import {
  AddAgentInputSchema,
  AddUserMessageInputSchema,
  AddAgentMessageInputSchema,
  SetUsernameInputSchema,
  SetSelectedAgentInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<ClaudeChatPHState> = (
  state,
  action,
  dispatch,
) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case "ADD_AGENT": {
      AddAgentInputSchema().parse(action.input);

      claudeChatAgentsOperations.addAgentOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_USER_MESSAGE": {
      AddUserMessageInputSchema().parse(action.input);

      claudeChatMessagesOperations.addUserMessageOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_AGENT_MESSAGE": {
      AddAgentMessageInputSchema().parse(action.input);

      claudeChatMessagesOperations.addAgentMessageOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_USERNAME": {
      SetUsernameInputSchema().parse(action.input);

      claudeChatUserOperations.setUsernameOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_SELECTED_AGENT": {
      SetSelectedAgentInputSchema().parse(action.input);

      claudeChatUserOperations.setSelectedAgentOperation(
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

export const reducer = createReducer<ClaudeChatPHState>(stateReducer);
