import { describe, it, expect } from '@jest/globals';
import {
  hasMarkers,
  parseMarkerRegions,
  spliceMarkerRegions,
} from '../../src/codegen/markers.js';

describe('parseMarkerRegions', () => {
  it('returns an empty list when there are no markers', () => {
    expect(parseMarkerRegions('no markers here\nline two')).toEqual([]);
  });

  it('extracts a single region body', () => {
    const src = [
      'prefix',
      '// @clint:begin foo',
      '  line 1',
      '  line 2',
      '// @clint:end foo',
      'suffix',
    ].join('\n');
    const [region] = parseMarkerRegions(src);
    expect(region.name).toBe('foo');
    expect(region.body).toEqual(['  line 1', '  line 2']);
  });

  it('handles multiple regions', () => {
    const src = [
      '// @clint:begin a',
      'aa',
      '// @clint:end a',
      'middle',
      '// @clint:begin b',
      'bb',
      '// @clint:end b',
    ].join('\n');
    const regions = parseMarkerRegions(src);
    expect(regions.map((r) => r.name)).toEqual(['a', 'b']);
  });

  it('throws on mismatched end', () => {
    const src = '// @clint:begin a\n// @clint:end b\n';
    expect(() => parseMarkerRegions(src)).toThrow(/does not match/);
  });

  it('throws on unterminated begin', () => {
    const src = '// @clint:begin a\nnothing else\n';
    expect(() => parseMarkerRegions(src)).toThrow(/unterminated/);
  });

  it('throws on nested begin', () => {
    const src = '// @clint:begin a\n// @clint:begin b\n';
    expect(() => parseMarkerRegions(src)).toThrow(/nested/);
  });

  it('throws on end without begin', () => {
    const src = '// @clint:end a\n';
    expect(() => parseMarkerRegions(src)).toThrow(/without matching begin/);
  });

  it('preserves the begin line indentation', () => {
    const src = [
      'export const x = {',
      '  // @clint:begin inner',
      '  foo: 1,',
      '  // @clint:end inner',
      '};',
    ].join('\n');
    const [region] = parseMarkerRegions(src);
    expect(region.indent).toBe('  ');
  });
});

describe('spliceMarkerRegions', () => {
  it('replaces target region body with source region body', () => {
    const target = [
      '// @clint:begin x',
      'old body',
      '// @clint:end x',
    ].join('\n');
    const source = [
      '// @clint:begin x',
      'new body',
      'second new line',
      '// @clint:end x',
    ].join('\n');
    const out = spliceMarkerRegions(target, source);
    expect(out).toBe(
      [
        '// @clint:begin x',
        'new body',
        'second new line',
        '// @clint:end x',
      ].join('\n'),
    );
  });

  it('preserves code outside the markers', () => {
    const target = [
      'hand-written prologue',
      '// @clint:begin x',
      'old',
      '// @clint:end x',
      'hand-written epilogue',
    ].join('\n');
    const source = [
      '// @clint:begin x',
      'new',
      '// @clint:end x',
    ].join('\n');
    const out = spliceMarkerRegions(target, source);
    expect(out).toBe(
      [
        'hand-written prologue',
        '// @clint:begin x',
        'new',
        '// @clint:end x',
        'hand-written epilogue',
      ].join('\n'),
    );
  });

  it('updates multiple independent regions in one pass', () => {
    const target = [
      '// @clint:begin a',
      'aa-old',
      '// @clint:end a',
      'between',
      '// @clint:begin b',
      'bb-old',
      '// @clint:end b',
    ].join('\n');
    const source = [
      '// @clint:begin a',
      'aa-new',
      '// @clint:end a',
      'NOT-MID',
      '// @clint:begin b',
      'bb-new',
      '// @clint:end b',
    ].join('\n');
    const out = spliceMarkerRegions(target, source);
    expect(out).toContain('aa-new');
    expect(out).toContain('bb-new');
    // Non-region code between regions stays from target (not source).
    expect(out).toContain('between');
    expect(out).not.toContain('NOT-MID');
  });

  it('leaves unrelated target regions alone', () => {
    const target = [
      '// @clint:begin a',
      'aa-old',
      '// @clint:end a',
      '// @clint:begin extra',
      'extra body',
      '// @clint:end extra',
    ].join('\n');
    const source = [
      '// @clint:begin a',
      'aa-new',
      '// @clint:end a',
    ].join('\n');
    const out = spliceMarkerRegions(target, source);
    expect(out).toContain('aa-new');
    expect(out).toContain('extra body');
  });

  it('is a no-op when target has no markers', () => {
    const target = 'plain\ncontent\n';
    const source = [
      '// @clint:begin x',
      'new',
      '// @clint:end x',
    ].join('\n');
    expect(spliceMarkerRegions(target, source)).toBe(target);
  });
});

describe('hasMarkers', () => {
  it('returns true when a begin marker is present', () => {
    expect(hasMarkers('// @clint:begin x\n// @clint:end x\n')).toBe(true);
  });
  it('returns false for plain content', () => {
    expect(hasMarkers('plain file\n')).toBe(false);
  });
});
