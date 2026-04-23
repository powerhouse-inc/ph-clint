import { type SignalDispatch } from 'document-model';
import type { AddExternalSkillAction, RemoveExternalSkillAction, SetExternalSkillNameAction, SetExternalSkillGithubUrlAction } from './actions.js';
import type { PhClintProjectState } from '../types.js';

export interface PhClintProjectExternalSkillsOperations {
  addExternalSkillOperation: (state: PhClintProjectState, action: AddExternalSkillAction, dispatch?: SignalDispatch) => void;
  removeExternalSkillOperation: (state: PhClintProjectState, action: RemoveExternalSkillAction, dispatch?: SignalDispatch) => void;
  setExternalSkillNameOperation: (state: PhClintProjectState, action: SetExternalSkillNameAction, dispatch?: SignalDispatch) => void;
  setExternalSkillGithubUrlOperation: (state: PhClintProjectState, action: SetExternalSkillGithubUrlAction, dispatch?: SignalDispatch) => void;
}
