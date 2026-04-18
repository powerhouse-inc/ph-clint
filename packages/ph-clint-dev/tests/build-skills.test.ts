import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildSkills, buildAgentProfiles, buildSkillTemplates, copyExternalSkills } from '../src/index.js';
import type { BuildConfig, ResolvedBuildConfig } from '../src/index.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-skills-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/** Create a mock CLI for buildSkills that returns the given prompts metadata. */
function mockCli(prompts?: {
  agents?: Record<string, { name: string; sections: string[]; skills: string[] }>;
  skills?: Record<string, string>;
}) {
  return {
    getMetadata: () => ({
      name: 'test-cli',
      version: '1.0.0',
      prompts: prompts ?? null,
    }),
  };
}

function makeConfig(overrides?: Partial<BuildConfig>): BuildConfig {
  return {
    cli: mockCli(),
    context: { workspaceDir: '/test/workspace', connectPort: '3000' },
    include: [path.join(tmpDir, 'prompts')],
    output: [path.join(tmpDir, 'output')],
    logger: () => {},
    ...overrides,
  };
}

function makeResolved(overrides?: Partial<ResolvedBuildConfig>): ResolvedBuildConfig {
  return {
    include: [path.join(tmpDir, 'prompts')],
    output: [path.join(tmpDir, 'output')],
    context: { workspaceDir: '/test/workspace', connectPort: '3000' },
    agentProfiles: [],
    skillDescriptions: {},
    clean: false,
    logger: () => {},
    ...overrides,
  };
}

describe('buildAgentProfiles', () => {
  it('builds agent profile instructions from base + specialized templates', () => {
    const profilesDir = path.join(tmpDir, 'prompts', 'agent-profiles');
    fs.mkdirSync(profilesDir, { recursive: true });
    fs.writeFileSync(path.join(profilesDir, 'Base.md'), 'Base for {{agentName}} at {{workspaceDir}}');
    fs.writeFileSync(path.join(profilesDir, 'Agent.md'), 'Specialized: port {{connectPort}}');

    const config = makeResolved({
      agentProfiles: [{ name: 'TestAgent', sections: ['Base.md', 'Agent.md'] }],
    });

    const result = buildAgentProfiles(config);
    expect(result.count).toBe(1);
    expect(result.warnings).toEqual([]);

    const outputPath = path.join(tmpDir, 'output', 'agent-profiles', 'TestAgent.md');
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('TestAgent');
    expect(content).toContain('/test/workspace');
    expect(content).toContain('port 3000');
  });

  it('skips profiles with missing template files', () => {
    const config = makeResolved({
      agentProfiles: [{ name: 'Missing', sections: ['nope.md', 'nope2.md'] }],
    });

    const result = buildAgentProfiles(config);
    expect(result.count).toBe(0);
  });

  it('returns 0 when no profiles defined', () => {
    const result = buildAgentProfiles(makeResolved());
    expect(result.count).toBe(0);
  });

  it('concatenates 3+ sections in order', () => {
    const profilesDir = path.join(tmpDir, 'prompts', 'agent-profiles');
    fs.mkdirSync(profilesDir, { recursive: true });
    fs.writeFileSync(path.join(profilesDir, 'Base.md'), 'SECTION-1');
    fs.writeFileSync(path.join(profilesDir, 'Domain.md'), 'SECTION-2');
    fs.writeFileSync(path.join(profilesDir, 'Tools.md'), 'SECTION-3');

    const config = makeResolved({
      agentProfiles: [{ name: 'Multi', sections: ['Base.md', 'Domain.md', 'Tools.md'] }],
    });

    const result = buildAgentProfiles(config);
    expect(result.count).toBe(1);

    const outputPath = path.join(tmpDir, 'output', 'agent-profiles', 'Multi.md');
    const content = fs.readFileSync(outputPath, 'utf-8');
    // Verify all three sections present and in order
    const idx1 = content.indexOf('SECTION-1');
    const idx2 = content.indexOf('SECTION-2');
    const idx3 = content.indexOf('SECTION-3');
    expect(idx1).toBeLessThan(idx2);
    expect(idx2).toBeLessThan(idx3);
  });

  it('reports warnings for missing template variables', () => {
    const profilesDir = path.join(tmpDir, 'prompts', 'agent-profiles');
    fs.mkdirSync(profilesDir, { recursive: true });
    fs.writeFileSync(path.join(profilesDir, 'Base.md'), 'Hello {{unknownVar}}');
    fs.writeFileSync(path.join(profilesDir, 'Agent.md'), 'OK');

    const config = makeResolved({
      agentProfiles: [{ name: 'Test', sections: ['Base.md', 'Agent.md'] }],
    });

    const result = buildAgentProfiles(config);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('unknownVar');
  });
});

describe('buildSkillTemplates', () => {
  it('builds SKILL.md with preamble and scenario references', () => {
    const skillDir = path.join(tmpDir, 'prompts', 'skills-tpl', 'my-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, '.preamble.md'), 'Preamble for port {{connectPort}}');
    fs.writeFileSync(path.join(skillDir, '00.check-prereqs.md'), 'Step 0: check {{workspaceDir}}');
    fs.writeFileSync(path.join(skillDir, '01.implement.md'), 'Step 1: implement');

    const config = makeResolved({
      skillDescriptions: { 'my-skill': 'My awesome skill' },
    });

    const result = buildSkillTemplates(config);
    expect(result.count).toBe(1);

    const skillMd = fs.readFileSync(path.join(tmpDir, 'output', 'skills', 'my-skill', 'SKILL.md'), 'utf-8');
    expect(skillMd).toContain('name: my-skill');
    expect(skillMd).toContain('My awesome skill');
    expect(skillMd).toContain('Preamble for port 3000');
    expect(skillMd).toContain('references/00.check-prereqs.md');
    expect(skillMd).toContain('references/01.implement.md');

    const ref0 = fs.readFileSync(path.join(tmpDir, 'output', 'skills', 'my-skill', 'references', '00.check-prereqs.md'), 'utf-8');
    expect(ref0).toContain('/test/workspace');
  });

  it('handles .result.md as expected-outcome reference', () => {
    const skillDir = path.join(tmpDir, 'prompts', 'skills-tpl', 'with-result');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, '.preamble.md'), 'Preamble');
    fs.writeFileSync(path.join(skillDir, '.result.md'), 'Expected: success');

    const result = buildSkillTemplates(makeResolved());
    expect(result.count).toBe(1);

    const skillMd = fs.readFileSync(path.join(tmpDir, 'output', 'skills', 'with-result', 'SKILL.md'), 'utf-8');
    expect(skillMd).toContain('Expected Outcome');
    expect(fs.existsSync(path.join(tmpDir, 'output', 'skills', 'with-result', 'references', 'expected-outcome.md'))).toBe(true);
  });

  it('skips skills with no content files', () => {
    const skillDir = path.join(tmpDir, 'prompts', 'skills-tpl', 'empty-skill');
    fs.mkdirSync(skillDir, { recursive: true });

    const result = buildSkillTemplates(makeResolved());
    expect(result.count).toBe(0);
  });

  it('returns 0 when skills-tpl directory missing', () => {
    const result = buildSkillTemplates(makeResolved());
    expect(result.count).toBe(0);
  });

  it('uses slugToTitle fallback when no skill description provided', () => {
    const skillDir = path.join(tmpDir, 'prompts', 'skills-tpl', 'my-cool-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, '.preamble.md'), 'Content');

    buildSkillTemplates(makeResolved());
    const skillMd = fs.readFileSync(path.join(tmpDir, 'output', 'skills', 'my-cool-skill', 'SKILL.md'), 'utf-8');
    expect(skillMd).toContain('My Cool Skill tasks');
  });
});

describe('copyExternalSkills', () => {
  it('copies external skill directories as-is', () => {
    const extDir = path.join(tmpDir, 'prompts', 'skills-ext', 'ext-skill');
    fs.mkdirSync(extDir, { recursive: true });
    fs.writeFileSync(path.join(extDir, 'SKILL.md'), '# External');
    fs.writeFileSync(path.join(extDir, 'extra.txt'), 'extra content');

    const count = copyExternalSkills(makeResolved());
    expect(count).toBe(1);

    const destDir = path.join(tmpDir, 'output', 'skills', 'ext-skill');
    expect(fs.existsSync(path.join(destDir, 'SKILL.md'))).toBe(true);
    expect(fs.readFileSync(path.join(destDir, 'extra.txt'), 'utf-8')).toBe('extra content');
  });

  it('returns 0 when no skills-ext directory', () => {
    const count = copyExternalSkills(makeResolved());
    expect(count).toBe(0);
  });
});

describe('buildSkills (orchestrator)', () => {
  it('runs all three steps and returns combined result', () => {
    // Set up agent profile
    const profilesDir = path.join(tmpDir, 'prompts', 'agent-profiles');
    fs.mkdirSync(profilesDir, { recursive: true });
    fs.writeFileSync(path.join(profilesDir, 'Base.md'), 'Base');
    fs.writeFileSync(path.join(profilesDir, 'Agent.md'), 'Agent');

    // Set up skill template
    const skillDir = path.join(tmpDir, 'prompts', 'skills-tpl', 'test-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, '.preamble.md'), 'Preamble');

    // Set up external skill
    const extDir = path.join(tmpDir, 'prompts', 'skills-ext', 'ext-skill');
    fs.mkdirSync(extDir, { recursive: true });
    fs.writeFileSync(path.join(extDir, 'SKILL.md'), '# Ext');

    const result = buildSkills(makeConfig({
      cli: mockCli({
        agents: {
          'test-agent': { name: 'Test', sections: ['Base.md', 'Agent.md'], skills: [] },
        },
      }),
    }));

    expect(result.agentProfilesBuilt).toBe(1);
    expect(result.skillsBuilt).toBe(1);
    expect(result.skillsCopied).toBe(1);
    expect(result.warnings).toEqual([]);
  });

  it('removes output directories when clean is true', () => {
    const outputDir = path.join(tmpDir, 'output');
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'stale-file.txt'), 'leftover');

    buildSkills(makeConfig({ clean: true }));

    expect(fs.existsSync(path.join(outputDir, 'stale-file.txt'))).toBe(false);
  });

  it('preserves output directories when clean is false', () => {
    const outputDir = path.join(tmpDir, 'output');
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'keep-me.txt'), 'keep');

    buildSkills(makeConfig({ clean: false }));

    expect(fs.existsSync(path.join(outputDir, 'keep-me.txt'))).toBe(true);
  });

  it('collects warnings from all steps', () => {
    const profilesDir = path.join(tmpDir, 'prompts', 'agent-profiles');
    fs.mkdirSync(profilesDir, { recursive: true });
    fs.writeFileSync(path.join(profilesDir, 'Base.md'), '{{missing}}');
    fs.writeFileSync(path.join(profilesDir, 'Agent.md'), 'OK');

    const skillDir = path.join(tmpDir, 'prompts', 'skills-tpl', 'test-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, '.preamble.md'), '{{alsoMissing}}');

    const result = buildSkills(makeConfig({
      cli: mockCli({
        agents: {
          'test-agent': { name: 'Test', sections: ['Base.md', 'Agent.md'], skills: [] },
        },
      }),
    }));

    expect(result.warnings.length).toBe(2);
    expect(result.warnings.some(w => w.includes('missing'))).toBe(true);
    expect(result.warnings.some(w => w.includes('alsoMissing'))).toBe(true);
  });
});
