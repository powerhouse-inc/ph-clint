import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { installSkills, createInitCommand } from '../src/core/init.js';
import { createWorkdirStore, createMemoryWorkdirStore } from '../src/core/store.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('installSkills', () => {
  it('copies skill folders from the first existing source', () => {
    const store = createWorkdirStore(tmpDir, 'testcli');
    const skillsDir = path.join(tmpDir, 'skills');

    // Create two skill folders with files
    fs.mkdirSync(path.join(skillsDir, 'skill-a'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'skill-a', 'SKILL.md'), '# Skill A');
    fs.mkdirSync(path.join(skillsDir, 'skill-b'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'skill-b', 'SKILL.md'), '# Skill B');
    fs.writeFileSync(path.join(skillsDir, 'skill-b', 'extra.txt'), 'extra');

    const logs: string[] = [];
    const count = installSkills({
      store,
      skillSources: ['/nonexistent', skillsDir],
      stdout: (msg) => logs.push(msg),
    });

    expect(count).toBe(2);

    // Verify files were copied
    const targetDir = store.getStoreFolder('.mastra/skills');
    expect(fs.existsSync(path.join(targetDir, 'skill-a', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'skill-b', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'skill-b', 'extra.txt'))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, 'skill-a', 'SKILL.md'), 'utf8')).toBe('# Skill A');
  });

  it('returns 0 when no source directories exist', () => {
    const store = createWorkdirStore(tmpDir, 'testcli');
    const logs: string[] = [];
    const count = installSkills({
      store,
      skillSources: ['/nonexistent-a', '/nonexistent-b'],
      stdout: (msg) => logs.push(msg),
    });

    expect(count).toBe(0);
    expect(logs.some(l => l.includes('No skill source directory found'))).toBe(true);
  });

  it('returns 0 when source has no subdirectories', () => {
    const store = createWorkdirStore(tmpDir, 'testcli');
    const emptyDir = path.join(tmpDir, 'empty-skills');
    fs.mkdirSync(emptyDir, { recursive: true });

    const logs: string[] = [];
    const count = installSkills({
      store,
      skillSources: [emptyDir],
      stdout: (msg) => logs.push(msg),
    });

    expect(count).toBe(0);
    expect(logs.some(l => l.includes('No skill folders found'))).toBe(true);
  });

  it('clears existing target before copying', () => {
    const store = createWorkdirStore(tmpDir, 'testcli');
    const skillsDir = path.join(tmpDir, 'skills');

    // Create a skill
    fs.mkdirSync(path.join(skillsDir, 'skill-a'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'skill-a', 'SKILL.md'), '# A');

    // Pre-populate target with stale skill
    const targetDir = store.getStoreFolder('.mastra/skills');
    fs.mkdirSync(path.join(targetDir, 'old-skill'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'old-skill', 'SKILL.md'), '# Old');

    installSkills({
      store,
      skillSources: [skillsDir],
      stdout: () => {},
    });

    // Old skill should be gone
    expect(fs.existsSync(path.join(targetDir, 'old-skill'))).toBe(false);
    // New skill should be there
    expect(fs.existsSync(path.join(targetDir, 'skill-a', 'SKILL.md'))).toBe(true);
  });

  it('uses first existing source and ignores later ones', () => {
    const store = createWorkdirStore(tmpDir, 'testcli');

    const first = path.join(tmpDir, 'first');
    const second = path.join(tmpDir, 'second');

    fs.mkdirSync(path.join(first, 'skill-from-first'), { recursive: true });
    fs.writeFileSync(path.join(first, 'skill-from-first', 'SKILL.md'), '# First');

    fs.mkdirSync(path.join(second, 'skill-from-second'), { recursive: true });
    fs.writeFileSync(path.join(second, 'skill-from-second', 'SKILL.md'), '# Second');

    installSkills({
      store,
      skillSources: [first, second],
      stdout: () => {},
    });

    const targetDir = store.getStoreFolder('.mastra/skills');
    expect(fs.existsSync(path.join(targetDir, 'skill-from-first'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'skill-from-second'))).toBe(false);
  });
});

describe('createInitCommand', () => {
  it('creates store directories and installs skills', async () => {
    const store = createWorkdirStore(tmpDir, 'testcli');
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'my-skill'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'my-skill', 'SKILL.md'), '# My Skill');

    const cmd = createInitCommand({ skillSources: [skillsDir] });
    const logs: string[] = [];
    const context = {
      workdir: tmpDir,
      workspace: store,
      config: {},
      stdout: (msg: string) => logs.push(msg),
    };

    const result = await cmd.execute({}, context) as { text: string };

    // Store root should exist
    expect(fs.existsSync(store.getStoreFolder())).toBe(true);
    // DB folder should exist
    expect(fs.existsSync(store.getStoreFolder('.mastra/db'))).toBe(true);
    // Skill should be installed
    expect(fs.existsSync(path.join(store.getStoreFolder('.mastra/skills'), 'my-skill', 'SKILL.md'))).toBe(true);
    // Output should contain init messages
    expect(result.text).toContain('[init]');
    expect(result.text).toContain('Workspace initialized');
  });

  it('works without any skill sources existing', async () => {
    const store = createWorkdirStore(tmpDir, 'testcli');
    const cmd = createInitCommand({ skillSources: ['/nonexistent'] });
    const logs: string[] = [];
    const context = {
      workdir: tmpDir,
      workspace: store,
      config: {},
      stdout: (msg: string) => logs.push(msg),
    };

    const result = await cmd.execute({}, context) as { text: string };

    expect(fs.existsSync(store.getStoreFolder())).toBe(true);
    expect(fs.existsSync(store.getStoreFolder('.mastra/db'))).toBe(true);
    expect(result.text).toContain('no skills to install');
  });

  it('is idempotent — safe to run multiple times', async () => {
    const store = createWorkdirStore(tmpDir, 'testcli');
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'my-skill'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'my-skill', 'SKILL.md'), '# My Skill');

    const cmd = createInitCommand({ skillSources: [skillsDir] });
    const context = {
      workdir: tmpDir,
      workspace: store,
      config: {},
      stdout: () => {},
    };

    await cmd.execute({}, context);
    await cmd.execute({}, context);

    expect(fs.existsSync(path.join(store.getStoreFolder('.mastra/skills'), 'my-skill', 'SKILL.md'))).toBe(true);
  });

  it('has correct id and description', () => {
    const cmd = createInitCommand({ skillSources: [] });
    expect(cmd.id).toBe('init');
    expect(cmd.description).toContain('Initialize');
  });
});
