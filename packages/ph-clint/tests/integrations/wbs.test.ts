import { describe, it, expect } from '@jest/globals';
import {
  findNextLeafGoal,
  resolveSkillFromGoal,
  ancestorChain,
  type WbsGoal,
  type WbsState,
} from '../../src/integrations/powerhouse/wbs.js';

const goal = (overrides: Partial<WbsGoal> & Pick<WbsGoal, 'id'>): WbsGoal => ({
  id: overrides.id,
  status: 'TODO',
  parentId: null,
  isDraft: false,
  dependencies: [],
  instructions: null,
  ...overrides,
});

describe('findNextLeafGoal', () => {
  it('returns null when there are no goals', () => {
    expect(findNextLeafGoal({ goals: [] })).toBeNull();
  });

  it('returns the first eligible leaf in DFS order', () => {
    const state: WbsState = {
      goals: [
        goal({ id: 'A' }),
        goal({ id: 'A.1', parentId: 'A' }),
        goal({ id: 'A.2', parentId: 'A' }),
        goal({ id: 'B' }),
      ],
    };
    const next = findNextLeafGoal(state);
    expect(next?.goal.id).toBe('A.1');
  });

  it('skips draft goals', () => {
    const state: WbsState = {
      goals: [
        goal({ id: 'A' }),
        goal({ id: 'A.1', parentId: 'A', isDraft: true }),
        goal({ id: 'A.2', parentId: 'A' }),
      ],
    };
    expect(findNextLeafGoal(state)?.goal.id).toBe('A.2');
  });

  it('skips finished and won-not-do leaves', () => {
    const state: WbsState = {
      goals: [
        goal({ id: 'A' }),
        goal({ id: 'A.1', parentId: 'A', status: 'COMPLETED' }),
        goal({ id: 'A.2', parentId: 'A', status: 'WONT_DO' }),
        goal({ id: 'A.3', parentId: 'A' }),
      ],
    };
    expect(findNextLeafGoal(state)?.goal.id).toBe('A.3');
  });

  it('skips entire subtree when parent is COMPLETED', () => {
    const state: WbsState = {
      goals: [
        goal({ id: 'A', status: 'COMPLETED' }),
        goal({ id: 'A.1', parentId: 'A' }),
        goal({ id: 'B' }),
      ],
    };
    expect(findNextLeafGoal(state)?.goal.id).toBe('B');
  });

  it('honors dependencies — blocks goals whose deps are not COMPLETED', () => {
    const state: WbsState = {
      goals: [
        goal({ id: 'X' }),
        goal({ id: 'Y', dependencies: ['X'] }),
      ],
    };
    expect(findNextLeafGoal(state)?.goal.id).toBe('X');
  });

  it('treats deps as satisfied when COMPLETED or WONT_DO', () => {
    const state: WbsState = {
      goals: [
        goal({ id: 'X', status: 'COMPLETED' }),
        goal({ id: 'Y', dependencies: ['X'] }),
      ],
    };
    expect(findNextLeafGoal(state)?.goal.id).toBe('Y');
  });

  it('returns IN_PROGRESS leaves (resumes work)', () => {
    const state: WbsState = {
      goals: [goal({ id: 'X', status: 'IN_PROGRESS' })],
    };
    expect(findNextLeafGoal(state)?.goal.id).toBe('X');
  });

  it('returns null when only BLOCKED / DELEGATED / IN_REVIEW remain', () => {
    const state: WbsState = {
      goals: [
        goal({ id: 'A', status: 'BLOCKED' }),
        goal({ id: 'B', status: 'DELEGATED' }),
        goal({ id: 'C', status: 'IN_REVIEW' }),
      ],
    };
    expect(findNextLeafGoal(state)).toBeNull();
  });

  it('returns the full ancestor chain root-to-leaf', () => {
    const state: WbsState = {
      goals: [
        goal({ id: 'top' }),
        goal({ id: 'mid', parentId: 'top' }),
        goal({ id: 'leaf', parentId: 'mid' }),
      ],
    };
    const next = findNextLeafGoal(state);
    expect(next?.goalChain.map(g => g.id)).toEqual(['top', 'mid', 'leaf']);
  });
});

describe('ancestorChain', () => {
  it('returns just the goal when it has no parent', () => {
    const g = goal({ id: 'solo' });
    const chain = ancestorChain(g, new Map([['solo', g]]));
    expect(chain.map(x => x.id)).toEqual(['solo']);
  });

  it('walks parent pointers root-to-leaf', () => {
    const top = goal({ id: 'top' });
    const mid = goal({ id: 'mid', parentId: 'top' });
    const leaf = goal({ id: 'leaf', parentId: 'mid' });
    const byId = new Map([['top', top], ['mid', mid], ['leaf', leaf]]);
    const chain = ancestorChain(leaf, byId);
    expect(chain.map(g => g.id)).toEqual(['top', 'mid', 'leaf']);
  });
});

describe('resolveSkillFromGoal', () => {
  it('pulls skill / scenario / task ids from the ancestor chain', () => {
    const top = goal({
      id: 'top',
      instructions: { workType: 'SKILL', workId: 'document-modeling' },
    });
    const mid = goal({
      id: 'mid',
      parentId: 'top',
      instructions: { workType: 'SCENARIO', workId: 'DM.01' },
    });
    const leaf = goal({
      id: 'leaf',
      parentId: 'mid',
      instructions: { workType: 'TASK', workId: 'DM.01.1' },
    });
    const resolved = resolveSkillFromGoal({ goal: leaf, goalChain: [top, mid, leaf] });
    expect(resolved).toEqual({
      skillId: 'document-modeling',
      scenarioId: 'DM.01',
      taskId: 'DM.01.1',
      goalId: 'leaf',
    });
  });

  it('returns null when no SKILL ancestor is present', () => {
    const top = goal({ id: 'top' });
    const leaf = goal({
      id: 'leaf',
      parentId: 'top',
      instructions: { workType: 'TASK', workId: 'DM.01.1' },
    });
    expect(resolveSkillFromGoal({ goal: leaf, goalChain: [top, leaf] })).toBeNull();
  });

  it('takes the topmost SKILL when nested skills are present', () => {
    const outer = goal({
      id: 'outer',
      instructions: { workType: 'SKILL', workId: 'outer-skill' },
    });
    const inner = goal({
      id: 'inner',
      parentId: 'outer',
      instructions: { workType: 'SKILL', workId: 'inner-skill' },
    });
    const resolved = resolveSkillFromGoal({ goal: inner, goalChain: [outer, inner] });
    expect(resolved?.skillId).toBe('outer-skill');
  });
});
