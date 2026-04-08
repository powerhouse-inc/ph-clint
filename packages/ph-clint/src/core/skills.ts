import fs from 'node:fs';
import path from 'node:path';

/**
 * Metadata extracted from a SKILL.md frontmatter.
 */
export interface SkillInfo {
  name: string;
  description: string;
}

/**
 * Parse YAML-ish frontmatter from a SKILL.md file.
 * Only extracts `name` and `description` — no YAML parser dependency needed.
 */
function parseFrontmatter(content: string): SkillInfo | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const block = match[1]!;
  const nameMatch = block.match(/^name:\s*(.+)$/m);
  const descMatch = block.match(/^description:\s*"?([^"\n]+)"?$/m);

  if (!nameMatch) return null;
  return {
    name: nameMatch[1]!.trim(),
    description: descMatch ? descMatch[1]!.trim() : '',
  };
}

/**
 * Read skill metadata from skill source directories.
 *
 * Scans each source directory for `{skillName}/SKILL.md` files, parses
 * frontmatter, and returns a deduplicated sorted list. First source wins
 * on name collisions.
 */
export function readSkillsFromSources(skillSources: string[]): SkillInfo[] {
  const seen = new Set<string>();
  const skills: SkillInfo[] = [];

  for (const source of skillSources) {
    if (!fs.existsSync(source)) continue;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(source, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (seen.has(entry.name)) continue;

      const skillMdPath = path.join(source, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillMdPath)) continue;

      try {
        const content = fs.readFileSync(skillMdPath, 'utf-8');
        const info = parseFrontmatter(content);
        if (info) {
          seen.add(entry.name);
          skills.push(info);
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}
