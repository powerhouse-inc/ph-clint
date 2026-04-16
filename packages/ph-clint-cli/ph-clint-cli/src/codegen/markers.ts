/**
 * Marker-region parsing for `@clint:begin {name}` / `@clint:end {name}`
 * comment blocks. Used in delta mode to splice freshly-generated regions
 * into an existing, user-edited file while preserving everything outside
 * the markers.
 *
 * The only syntactic requirement is that the markers are on their own lines,
 * as ordinary line comments (`//`). Indentation is preserved for output.
 */

export interface MarkerRegion {
  /** Region identifier (the text after `@clint:begin`). */
  name: string;
  /** Lines *between* the begin and end markers (exclusive). */
  body: string[];
  /** Indentation of the begin line — used when rewriting. */
  indent: string;
  /** Line index of the begin marker in the source. */
  beginLine: number;
  /** Line index of the end marker in the source. */
  endLine: number;
}

const BEGIN_RE = /^([ \t]*)\/\/\s*@clint:begin\s+(\S+)\s*$/;
const END_RE = /^([ \t]*)\/\/\s*@clint:end\s+(\S+)\s*$/;

/**
 * Parse every `@clint:begin {name}` … `@clint:end {name}` block in `source`.
 * Throws if markers are mismatched or unclosed.
 */
export function parseMarkerRegions(source: string): MarkerRegion[] {
  const lines = source.split('\n');
  const regions: MarkerRegion[] = [];
  let open: { name: string; indent: string; beginLine: number } | null = null;
  let bodyStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const begin = BEGIN_RE.exec(line);
    if (begin) {
      if (open) {
        throw new Error(
          `nested @clint:begin ${begin[2]} at line ${i + 1} while ${open.name} is still open`,
        );
      }
      open = { name: begin[2], indent: begin[1], beginLine: i };
      bodyStart = i + 1;
      continue;
    }
    const end = END_RE.exec(line);
    if (end) {
      if (!open) {
        throw new Error(`@clint:end ${end[2]} at line ${i + 1} without matching begin`);
      }
      if (open.name !== end[2]) {
        throw new Error(
          `@clint:end ${end[2]} at line ${i + 1} does not match open @clint:begin ${open.name}`,
        );
      }
      regions.push({
        name: open.name,
        body: lines.slice(bodyStart, i),
        indent: open.indent,
        beginLine: open.beginLine,
        endLine: i,
      });
      open = null;
    }
  }

  if (open) {
    throw new Error(`unterminated @clint:begin ${open.name}`);
  }
  return regions;
}

/**
 * Replace every region in `target` that also exists in `source` with the
 * `source` region's body. Leaves regions present in `target` but not `source`
 * untouched. Ignores regions in `source` missing from `target`.
 *
 * Returns the rewritten file content.
 */
export function spliceMarkerRegions(target: string, source: string): string {
  const sourceRegions = parseMarkerRegions(source);
  const sourceByName = new Map<string, MarkerRegion>();
  for (const r of sourceRegions) sourceByName.set(r.name, r);

  const targetRegions = parseMarkerRegions(target);
  if (targetRegions.length === 0) return target;

  const lines = target.split('\n');
  // Apply replacements from last to first so line indices stay valid.
  const sorted = [...targetRegions].sort((a, b) => b.beginLine - a.beginLine);
  for (const region of sorted) {
    const fresh = sourceByName.get(region.name);
    if (!fresh) continue;
    // Replace the body lines (exclusive of the begin/end marker lines).
    const bodyLen = region.endLine - region.beginLine - 1;
    lines.splice(region.beginLine + 1, bodyLen, ...fresh.body);
  }
  return lines.join('\n');
}

/** Convenience — true if `content` contains at least one `@clint:begin`. */
export function hasMarkers(content: string): boolean {
  return /^[ \t]*\/\/\s*@clint:begin\s+\S+\s*$/m.test(content);
}
