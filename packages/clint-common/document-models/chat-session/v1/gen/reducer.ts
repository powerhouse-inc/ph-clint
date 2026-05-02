/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Reducer, StateReducer } from 'document-model';
import { createReducer, isDocumentAction } from 'document-model';
import type { ChatSessionPHState } from 'document-models/chat-session/v1';

import { chatSessionAgentOperations } from '../src/reducers/agent.js';
import { chatSessionSystemOperations } from '../src/reducers/system.js';
import { chatSessionToolOperations } from '../src/reducers/tool.js';
import { chatSessionUserOperations } from '../src/reducers/user.js';

import {
  AbortSessionInputSchema,
  AddAssistantMessageInputSchema,
  AddSystemMessageInputSchema,
  AddToolOutputInputSchema,
  AddToolResultInputSchema,
  AddUserMessageInputSchema,
  AppendAssistantContentInputSchema,
  DeleteUserMessageInputSchema,
  EndSessionInputSchema,
  SetAgentDescriptionInputSchema,
  SetAgentImageInputSchema,
  SetAgentInfoInputSchema,
  SetMessageUsageInputSchema,
  StartSessionInputSchema,
  UpdateAssistantContentInputSchema,
  UpdateUsageSummaryInputSchema,
} from './schema/zod.js';

const stateReducer: StateReducer<ChatSessionPHState> = (state, action, dispatch) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case 'START_SESSION': {
      StartSessionInputSchema().parse(action.input);

      chatSessionSystemOperations.startSessionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_AGENT_INFO': {
      SetAgentInfoInputSchema().parse(action.input);

      chatSessionSystemOperations.setAgentInfoOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'END_SESSION': {
      EndSessionInputSchema().parse(action.input);

      chatSessionSystemOperations.endSessionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'UPDATE_USAGE_SUMMARY': {
      UpdateUsageSummaryInputSchema().parse(action.input);

      chatSessionSystemOperations.updateUsageSummaryOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_SYSTEM_MESSAGE': {
      AddSystemMessageInputSchema().parse(action.input);

      chatSessionSystemOperations.addSystemMessageOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_AGENT_IMAGE': {
      SetAgentImageInputSchema().parse(action.input);

      chatSessionSystemOperations.setAgentImageOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_AGENT_DESCRIPTION': {
      SetAgentDescriptionInputSchema().parse(action.input);

      chatSessionSystemOperations.setAgentDescriptionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_USER_MESSAGE': {
      AddUserMessageInputSchema().parse(action.input);

      chatSessionUserOperations.addUserMessageOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'DELETE_USER_MESSAGE': {
      DeleteUserMessageInputSchema().parse(action.input);

      chatSessionUserOperations.deleteUserMessageOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ABORT_SESSION': {
      AbortSessionInputSchema().parse(action.input);

      chatSessionUserOperations.abortSessionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_ASSISTANT_MESSAGE': {
      AddAssistantMessageInputSchema().parse(action.input);

      chatSessionAgentOperations.addAssistantMessageOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'APPEND_ASSISTANT_CONTENT': {
      AppendAssistantContentInputSchema().parse(action.input);

      chatSessionAgentOperations.appendAssistantContentOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'UPDATE_ASSISTANT_CONTENT': {
      UpdateAssistantContentInputSchema().parse(action.input);

      chatSessionAgentOperations.updateAssistantContentOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_MESSAGE_USAGE': {
      SetMessageUsageInputSchema().parse(action.input);

      chatSessionAgentOperations.setMessageUsageOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_TOOL_RESULT': {
      AddToolResultInputSchema().parse(action.input);

      chatSessionToolOperations.addToolResultOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_TOOL_OUTPUT': {
      AddToolOutputInputSchema().parse(action.input);

      chatSessionToolOperations.addToolOutputOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    default:
      return state;
  }
};

export const reducer: Reducer<ChatSessionPHState> = createReducer(stateReducer);
