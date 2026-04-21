import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { detectLayout } from '../../src/project/layout.js';

describe('detectLayout', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-clint-layout-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  function writePackageJson(dir: string, content: Record<string, unknown>): void {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(content, null, 2));
  }

  it('detects a flat layout', () => {
    writePackageJson(tmp, {
      name: 'my-tool',
      dependencies: { '@powerhousedao/ph-clint': '^0.1.0' },
    });

    const layout = detectLayout(tmp);
    expect(layout).toEqual({ type: 'flat', root: tmp, cli: tmp });
  });

  it('detects a split layout from the root', () => {
    writePackageJson(path.join(tmp, 'foo-cli'), {
      name: '@acme/foo-cli',
      dependencies: { '@powerhousedao/ph-clint': '^0.1.0' },
    });
    writePackageJson(path.join(tmp, 'foo-app'), {
      name: '@acme/foo-app',
    });

    const layout = detectLayout(tmp);
    expect(layout).toEqual({
      type: 'split',
      root: tmp,
      cli: path.join(tmp, 'foo-cli'),
      app: path.join(tmp, 'foo-app'),
    });
  });

  it('detects a split layout when startDir is inside the cli sub-package', () => {
    writePackageJson(path.join(tmp, 'bar-cli'), {
      name: '@acme/bar-cli',
      dependencies: { '@powerhousedao/ph-clint': 'file:../../ph-clint' },
    });
    writePackageJson(path.join(tmp, 'bar-app'), {
      name: '@acme/bar-app',
    });

    const layout = detectLayout(path.join(tmp, 'bar-cli'));
    expect(layout).toEqual({
      type: 'split',
      root: tmp,
      cli: path.join(tmp, 'bar-cli'),
      app: path.join(tmp, 'bar-app'),
    });
  });

  it('detects ph-clint in devDependencies for flat layout', () => {
    writePackageJson(tmp, {
      name: 'my-tool',
      devDependencies: { '@powerhousedao/ph-clint': '^0.1.0' },
    });

    const layout = detectLayout(tmp);
    expect(layout).toEqual({ type: 'flat', root: tmp, cli: tmp });
  });

  it('returns null when no ph-clint project is found', () => {
    writePackageJson(tmp, { name: 'unrelated' });
    expect(detectLayout(tmp)).toBeNull();
  });

  it('returns null for an empty directory', () => {
    expect(detectLayout(tmp)).toBeNull();
  });

  it('returns null for a non-existent directory', () => {
    expect(detectLayout(path.join(tmp, 'nope'))).toBeNull();
  });

  it('ignores split dirs where cli has no ph-clint dep', () => {
    writePackageJson(path.join(tmp, 'baz-cli'), {
      name: '@acme/baz-cli',
      dependencies: { 'some-other-lib': '^1.0.0' },
    });
    writePackageJson(path.join(tmp, 'baz-app'), {
      name: '@acme/baz-app',
    });

    expect(detectLayout(tmp)).toBeNull();
  });
});
