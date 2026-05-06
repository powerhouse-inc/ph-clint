/**
 * Tests for the external skills sync module.
 *
 * Unit tests for `diffSkills` (pure function) and integration tests for
 * `syncExternalSkills` (filesystem + git clone).
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  diffSkills,
  syncExternalSkills,
  readManifest,
  type ManifestEntry,
} from '../../src/skills/sync.js';
import type { ExternalSkill } from '../../src/spec/types.js';

function skill(name: string, url = `https://github.com/example/${name}`): ExternalSkill {
  return { id: `skill-${name}`, name, githubUrl: url };
}

function entry(name: string, url = `https://github.com/example/${name}`): ManifestEntry {
  return { name, githubUrl: url };
}

describe('diffSkills', () => {
  it('returns empty when both lists are empty', () => {
    const result = diffSkills([], []);
    expect(result.toAdd).toEqual([]);
    expect(result.toRemove).toEqual([]);
    expect(result.unchanged).toEqual([]);
  });

  it('marks all desired as additions when manifest is empty', () => {
    const desired = [skill('foo'), skill('bar')];
    const result = diffSkills(desired, []);
    expect(result.toAdd).toEqual(desired);
    expect(result.toRemove).toEqual([]);
    expect(result.unchanged).toEqual([]);
  });

  it('marks all manifest entries as removals when desired is empty', () => {
    const current = [entry('foo'), entry('bar')];
    const result = diffSkills([], current);
    expect(result.toRemove).toEqual(current);
    expect(result.toAdd).toEqual([]);
    expect(result.unchanged).toEqual([]);
  });

  it('detects unchanged skills', () => {
    const desired = [skill('foo')];
    const current = [entry('foo')];
    const result = diffSkills(desired, current);
    expect(result.unchanged).toEqual(['foo']);
    expect(result.toAdd).toEqual([]);
    expect(result.toRemove).toEqual([]);
  });

  it('detects URL changes as remove + add', () => {
    const desired = [skill('foo', 'https://github.com/new/foo')];
    const current = [entry('foo', 'https://github.com/old/foo')];
    const result = diffSkills(desired, current);
    expect(result.toRemove).toEqual([entry('foo', 'https://github.com/old/foo')]);
    expect(result.toAdd).toEqual([skill('foo', 'https://github.com/new/foo')]);
    expect(result.unchanged).toEqual([]);
  });

  it('handles mixed add/remove/unchanged', () => {
    const desired = [skill('keep'), skill('add-me')];
    const current = [entry('keep'), entry('remove-me')];
    const result = diffSkills(desired, current);
    expect(result.unchanged).toEqual(['keep']);
    expect(result.toAdd.map((s) => s.name)).toEqual(['add-me']);
    expect(result.toRemove.map((s) => s.name)).toEqual(['remove-me']);
  });
});

describe('syncExternalSkills', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-skills-'));
    // Create the skills-ext directory.
    await fs.mkdir(path.join(tmp, 'prompts', 'skills-ext'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('writes empty manifest when desired is empty', async () => {
    const result = await syncExternalSkills({
      targetDir: tmp,
      desired: [],
    });
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.unchanged).toEqual([]);
    const manifest = await readManifest(tmp);
    expect(manifest).toEqual([]);
  });

  it('removes a skill that is no longer desired', async () => {
    // Pre-populate a skill directory + manifest.
    const skillDir = path.join(tmp, 'prompts', 'skills-ext', 'old-skill');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), '# Old Skill\n');
    const manifestPath = path.join(tmp, 'prompts', 'skills-ext', '.skills-manifest.json');
    await fs.writeFile(
      manifestPath,
      JSON.stringify([{ name: 'old-skill', githubUrl: 'https://github.com/x/old-skill' }]),
    );

    const result = await syncExternalSkills({
      targetDir: tmp,
      desired: [],
    });
    expect(result.removed).toEqual(['old-skill']);
    expect(result.added).toEqual([]);

    // Directory should be gone.
    await expect(fs.access(skillDir)).rejects.toThrow();
  });

  it('readManifest returns empty array for missing file', async () => {
    const manifest = await readManifest(tmp);
    expect(manifest).toEqual([]);
  });
});
