import { describe, it, expect } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  backupPackageJson,
  restorePackageJson,
  rewritePackageJson,
  restoreFileDepPaths,
  removeBackup,
} from '../../src/publish/rewrite.js';
import type { ResolvedPackage, PackageEntry } from '../../src/publish/types.js';

function setupPkg(tmp: string): { dir: string; pkg: ResolvedPackage } {
  const dir = path.join(tmp, 'mypkg');
  fs.mkdirSync(dir, { recursive: true });
  const pkgJson = {
    name: 'mypkg',
    version: '0.0.1',
    dependencies: {
      mylib: 'file:../mylib',
      lodash: '^4.0.0',
    },
    devDependencies: {
      devtool: 'file:../devtool',
    },
  };
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(pkgJson, null, 2) + '\n',
  );

  const entry: PackageEntry = { path: 'mypkg', category: 'cli' };
  const pkg: ResolvedPackage = {
    entry,
    absPath: dir,
    packageJson: pkgJson,
    name: 'mypkg',
    fileDeps: [
      {
        name: 'mylib',
        originalSpecifier: 'file:../mylib',
        resolvedPath: path.join(tmp, 'mylib'),
        intraGroup: true,
        publishVersion: '^1.0.0-dev.0',
        field: 'dependencies',
      },
      {
        name: 'devtool',
        originalSpecifier: 'file:../devtool',
        resolvedPath: path.join(tmp, 'devtool'),
        intraGroup: false,
        publishVersion: '^0.5.0',
        field: 'devDependencies',
      },
    ],
  };

  return { dir, pkg };
}

describe('backupPackageJson / restorePackageJson', () => {
  it('creates backup and restores', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rewrite-test-'));
    const { dir } = setupPkg(tmp);

    const original = fs.readFileSync(path.join(dir, 'package.json'), 'utf-8');
    backupPackageJson(dir);

    // Modify the original
    fs.writeFileSync(path.join(dir, 'package.json'), '{"modified": true}');

    restorePackageJson(dir);
    const restored = fs.readFileSync(path.join(dir, 'package.json'), 'utf-8');
    expect(restored).toBe(original);

    // Backup should be removed
    expect(
      fs.existsSync(path.join(dir, 'package.json.publish-backup')),
    ).toBe(false);

    fs.rmSync(tmp, { recursive: true });
  });
});

describe('rewritePackageJson', () => {
  it('sets version and rewrites file: deps', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rewrite-test-'));
    const { dir, pkg } = setupPkg(tmp);

    rewritePackageJson(pkg, '1.0.0-dev.0');

    const result = JSON.parse(
      fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'),
    );
    expect(result.version).toBe('1.0.0-dev.0');
    expect(result.dependencies.mylib).toBe('^1.0.0-dev.0');
    expect(result.dependencies.lodash).toBe('^4.0.0'); // unchanged
    expect(result.devDependencies.devtool).toBe('^0.5.0');

    fs.rmSync(tmp, { recursive: true });
  });
});

describe('restoreFileDepPaths', () => {
  it('restores file: specifiers but keeps version', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rewrite-test-'));
    const { dir, pkg } = setupPkg(tmp);

    // First rewrite
    rewritePackageJson(pkg, '1.0.0-dev.0');
    // Then restore file: paths
    restoreFileDepPaths(pkg);

    const result = JSON.parse(
      fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'),
    );
    expect(result.version).toBe('1.0.0-dev.0'); // version kept
    expect(result.dependencies.mylib).toBe('file:../mylib'); // restored
    expect(result.devDependencies.devtool).toBe('file:../devtool'); // restored

    fs.rmSync(tmp, { recursive: true });
  });
});

describe('rewritePackageJson with workspace: deps', () => {
  it('rewrites workspace: deps and restores them', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rewrite-test-'));
    const dir = path.join(tmp, 'mypkg');
    fs.mkdirSync(dir, { recursive: true });
    const pkgJson = {
      name: 'mypkg',
      version: '0.0.1',
      dependencies: {
        mylib: 'workspace:*',
        lodash: '^4.0.0',
      },
      peerDependencies: {
        myframework: 'workspace:*',
      },
    };
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify(pkgJson, null, 2) + '\n',
    );

    const entry: PackageEntry = { path: 'mypkg', category: 'cli' };
    const pkg: ResolvedPackage = {
      entry,
      absPath: dir,
      packageJson: pkgJson,
      name: 'mypkg',
      fileDeps: [
        {
          name: 'mylib',
          originalSpecifier: 'workspace:*',
          resolvedPath: '',
          intraGroup: true,
          publishVersion: '^1.0.0-dev.0',
          field: 'dependencies',
        },
        {
          name: 'myframework',
          originalSpecifier: 'workspace:*',
          resolvedPath: '',
          intraGroup: true,
          publishVersion: '^1.0.0-dev.0',
          field: 'peerDependencies',
        },
      ],
    };

    rewritePackageJson(pkg, '1.0.0-dev.0');

    const rewritten = JSON.parse(
      fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'),
    );
    expect(rewritten.version).toBe('1.0.0-dev.0');
    expect(rewritten.dependencies.mylib).toBe('^1.0.0-dev.0');
    expect(rewritten.dependencies.lodash).toBe('^4.0.0');
    expect(rewritten.peerDependencies.myframework).toBe('^1.0.0-dev.0');

    // Restore
    restoreFileDepPaths(pkg);
    const restored = JSON.parse(
      fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'),
    );
    expect(restored.dependencies.mylib).toBe('workspace:*');
    expect(restored.peerDependencies.myframework).toBe('workspace:*');
    expect(restored.version).toBe('1.0.0-dev.0'); // version kept

    fs.rmSync(tmp, { recursive: true });
  });
});

describe('removeBackup', () => {
  it('removes backup file', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rewrite-test-'));
    const { dir } = setupPkg(tmp);

    backupPackageJson(dir);
    expect(
      fs.existsSync(path.join(dir, 'package.json.publish-backup')),
    ).toBe(true);

    removeBackup(dir);
    expect(
      fs.existsSync(path.join(dir, 'package.json.publish-backup')),
    ).toBe(false);

    fs.rmSync(tmp, { recursive: true });
  });

  it('no-ops when no backup exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rewrite-test-'));
    const { dir } = setupPkg(tmp);
    expect(() => removeBackup(dir)).not.toThrow();
    fs.rmSync(tmp, { recursive: true });
  });
});
