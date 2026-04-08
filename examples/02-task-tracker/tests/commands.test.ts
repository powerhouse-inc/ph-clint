import { describe, it, expect, beforeEach } from '@jest/globals';
import { add } from '../src/commands/add.js';
import { list } from '../src/commands/list.js';
import { done } from '../src/commands/done.js';
import { remove } from '../src/commands/remove.js';
import type { Task } from '../src/types.js';

// Mock workspace: in-memory key-value store
function createMockWorkspace() {
  const store: Record<string, any> = {};
  return {
    getWorkdir: () => '',
    getLocalConfigPath: () => '',
    getStoreFolder: (path?: string) => path ?? '',
    loadJsonObject: async <T>(key: string, fallback: T): Promise<T> => {
      return (store[key] as T) ?? fallback;
    },
    storeJsonObject: async (key: string, value: any): Promise<void> => {
      store[key] = value;
    },
    loadLocalConfig: async <T>(fallback: T): Promise<T> => fallback,
    storeLocalConfig: async () => {},
    _store: store,
  };
}

function createContext(workspace: ReturnType<typeof createMockWorkspace>, configOverrides?: Partial<{ defaultPriority: string }>) {
  return {
    workdir: '',
    workspace,
    config: {
      defaultPriority: 'medium' as const,
      ...configOverrides,
    },
  };
}

describe('add command', () => {
  it('has the correct definition', () => {
    expect(add.id).toBe('add');
    expect(add.description).toBe('Add a new task');
    expect(add.inputSchema.shape).toHaveProperty('title');
    expect(add.inputSchema.shape).toHaveProperty('priority');
    expect(add.inputSchema.shape).toHaveProperty('due');
  });

  it('has prompt config for interactive parameter prompting', () => {
    expect(add.prompt).toBeDefined();
    expect(add.prompt!.promptForDefaults).toBe(false);
    expect(add.prompt!.promptOptional).toContain('priority');
  });

  it('adds a task with explicit priority', async () => {
    const workspace = createMockWorkspace();
    const ctx = createContext(workspace);
    const result = await add.execute({ title: 'Write tests', priority: 'high' }, ctx);

    expect(result.text).toContain('Write tests');
    expect(result.text).toContain('high');
    expect(result.data.title).toBe('Write tests');
    expect(result.data.priority).toBe('high');
    expect(result.data.done).toBe(false);
    expect(result.data.id).toBeDefined();

    const tasks = await workspace.loadJsonObject<Task[]>('tasks.json', []);
    expect(tasks).toHaveLength(1);
  });

  it('uses config defaultPriority when priority is omitted', async () => {
    const workspace = createMockWorkspace();
    const ctx = createContext(workspace, { defaultPriority: 'high' });
    const result = await add.execute({ title: 'Urgent task' }, ctx);

    expect(result.data.priority).toBe('high');
  });

  it('defaults to medium priority via config', async () => {
    const workspace = createMockWorkspace();
    const ctx = createContext(workspace);
    const result = await add.execute({ title: 'Normal task' }, ctx);

    expect(result.data.priority).toBe('medium');
  });

  it('stores due date when provided', async () => {
    const workspace = createMockWorkspace();
    const ctx = createContext(workspace);
    const result = await add.execute({ title: 'Task', due: '2026-12-31' }, ctx);

    expect(result.data.due).toBe('2026-12-31');
  });

  it('sets due to null when omitted', async () => {
    const workspace = createMockWorkspace();
    const ctx = createContext(workspace);
    const result = await add.execute({ title: 'Task' }, ctx);

    expect(result.data.due).toBeNull();
  });

  it('appends to existing tasks', async () => {
    const workspace = createMockWorkspace();
    const ctx = createContext(workspace);

    await add.execute({ title: 'First' }, ctx);
    await add.execute({ title: 'Second' }, ctx);

    const tasks = await workspace.loadJsonObject<Task[]>('tasks.json', []);
    expect(tasks).toHaveLength(2);
    expect(tasks[0]!.title).toBe('First');
    expect(tasks[1]!.title).toBe('Second');
  });
});

describe('list command', () => {
  it('has the correct definition', () => {
    expect(list.id).toBe('list');
    expect(list.inputSchema.shape).toHaveProperty('filter');
  });

  it('returns empty message when no tasks exist', async () => {
    const workspace = createMockWorkspace();
    const ctx = createContext(workspace);
    const result = await list.execute({ filter: 'open' }, ctx);

    expect(result.text).toContain('No tasks found');
    expect(result.data).toEqual([]);
  });

  it('lists open tasks by default', async () => {
    const workspace = createMockWorkspace();
    workspace._store['tasks.json'] = [
      { id: '1', title: 'Open task', priority: 'medium', due: null, done: false },
      { id: '2', title: 'Done task', priority: 'low', due: null, done: true },
    ];
    const ctx = createContext(workspace);

    const result = await list.execute({ filter: 'open' }, ctx);
    expect(result.data).toHaveLength(1);
    expect(result.text).toContain('Open task');
    expect(result.text).not.toContain('Done task');
    expect(result.text).toContain('[ ]');
  });

  it('lists done tasks', async () => {
    const workspace = createMockWorkspace();
    workspace._store['tasks.json'] = [
      { id: '1', title: 'Open task', priority: 'medium', due: null, done: false },
      { id: '2', title: 'Done task', priority: 'low', due: null, done: true },
    ];
    const ctx = createContext(workspace);

    const result = await list.execute({ filter: 'done' }, ctx);
    expect(result.data).toHaveLength(1);
    expect(result.text).toContain('Done task');
    expect(result.text).toContain('[x]');
  });

  it('lists all tasks', async () => {
    const workspace = createMockWorkspace();
    workspace._store['tasks.json'] = [
      { id: '1', title: 'Open', priority: 'medium', due: null, done: false },
      { id: '2', title: 'Done', priority: 'low', due: null, done: true },
    ];
    const ctx = createContext(workspace);

    const result = await list.execute({ filter: 'all' }, ctx);
    expect(result.data).toHaveLength(2);
  });

  it('applies default filter from schema', () => {
    const parsed = list.inputSchema.parse({});
    expect(parsed.filter).toBe('open');
  });
});

describe('done command', () => {
  it('marks a matching task as completed', async () => {
    const workspace = createMockWorkspace();
    workspace._store['tasks.json'] = [
      { id: '1', title: 'Write tests', priority: 'high', due: null, done: false },
    ];
    const ctx = createContext(workspace);

    const result = await done.execute({ title: 'tests' }, ctx);
    expect(result.text).toContain('Completed');
    expect(result.text).toContain('Write tests');

    const tasks = await workspace.loadJsonObject<Task[]>('tasks.json', []);
    expect(tasks[0]!.done).toBe(true);
  });

  it('matches case-insensitively', async () => {
    const workspace = createMockWorkspace();
    workspace._store['tasks.json'] = [
      { id: '1', title: 'Write Tests', priority: 'high', due: null, done: false },
    ];
    const ctx = createContext(workspace);

    const result = await done.execute({ title: 'TESTS' }, ctx);
    expect(result.text).toContain('Completed');
  });

  it('returns message when no match found', async () => {
    const workspace = createMockWorkspace();
    workspace._store['tasks.json'] = [
      { id: '1', title: 'Write tests', priority: 'high', due: null, done: true },
    ];
    const ctx = createContext(workspace);

    const result = await done.execute({ title: 'tests' }, ctx);
    expect(result.text).toContain('No open task matching');
  });

  it('skips already-done tasks', async () => {
    const workspace = createMockWorkspace();
    workspace._store['tasks.json'] = [
      { id: '1', title: 'Write tests', priority: 'high', due: null, done: true },
      { id: '2', title: 'Write more tests', priority: 'medium', due: null, done: false },
    ];
    const ctx = createContext(workspace);

    const result = await done.execute({ title: 'tests' }, ctx);
    expect(result.data!.id).toBe('2');
  });
});

describe('remove command', () => {
  it('removes a matching task', async () => {
    const workspace = createMockWorkspace();
    workspace._store['tasks.json'] = [
      { id: '1', title: 'Write tests', priority: 'high', due: null, done: false },
      { id: '2', title: 'Deploy app', priority: 'medium', due: null, done: false },
    ];
    const ctx = createContext(workspace);

    const result = await remove.execute({ title: 'tests' }, ctx);
    expect(result.text).toContain('Removed');
    expect(result.text).toContain('Write tests');

    const tasks = await workspace.loadJsonObject<Task[]>('tasks.json', []);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.title).toBe('Deploy app');
  });

  it('returns message when no match found', async () => {
    const workspace = createMockWorkspace();
    workspace._store['tasks.json'] = [];
    const ctx = createContext(workspace);

    const result = await remove.execute({ title: 'nonexistent' }, ctx);
    expect(result.text).toContain('No task matching');
  });
});
