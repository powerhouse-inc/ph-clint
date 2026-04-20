import { describe, it, expect } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyzeFileDeps, resolveAllFileDeps } from '../../src/publish/deps.js';
import type { ResolvedPackage, PackageEntry } from '../../src/publish/types.js';

function makeTempPkg(
  dir: string,
  name: string,
  deps?: Record<string, string>,
  devDeps?: Record<string, string>,
): string {
  const pkgDir = path.join(dir, name);
  fs.mkdirSync(pkgDir, { recursive: true });
  const pkgJson: Record<string, unknown> = { name, version: '0.0.1' };
  if (deps) pkgJson.dependencies = deps;
  if (devDeps) pkgJson.devDependencies = devDeps;
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(pkgJson, null, 2),
  );
  return pkgDir;
}

describe('analyzeFileDeps', () => {
  it('classifies intra-group file: deps', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-test-'));
    const libDir = makeTempPkg(tmp, 'mylib');
    const cliDir = makeTempPkg(tmp, 'mycli', {
      mylib: `file:../mylib`,
    });

    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(cliDir, 'package.json'), 'utf-8'),
    );
    const deps = analyzeFileDeps(cliDir, pkgJson, [libDir, cliDir]);

    expect(deps).toHaveLength(1);
    expect(deps[0].name).toBe('mylib');
    expect(deps[0].intraGroup).toBe(true);
    expect(deps[0].field).toBe('dependencies');

    fs.rmSync(tmp, { recursive: true });
  });

  it('classifies external file: deps', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-test-'));
    const extDir = makeTempPkg(tmp, 'external-pkg');
    const cliDir = makeTempPkg(tmp, 'mycli', {
      'external-pkg': `file:../external-pkg`,
    });

    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(cliDir, 'package.json'), 'utf-8'),
    );
    // Only cliDir is in the group (extDir is not)
    const deps = analyzeFileDeps(cliDir, pkgJson, [cliDir]);

    expect(deps).toHaveLength(1);
    expect(deps[0].name).toBe('external-pkg');
    expect(deps[0].intraGroup).toBe(false);
  });

  it('handles devDependencies', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-test-'));
    const devDir = makeTempPkg(tmp, 'devtool');
    const cliDir = makeTempPkg(tmp, 'mycli', undefined, {
      devtool: `file:../devtool`,
    });

    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(cliDir, 'package.json'), 'utf-8'),
    );
    const deps = analyzeFileDeps(cliDir, pkgJson, [cliDir]);

    expect(deps).toHaveLength(1);
    expect(deps[0].field).toBe('devDependencies');
  });

  it('ignores non-file: deps', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-test-'));
    const cliDir = makeTempPkg(tmp, 'mycli', {
      lodash: '^4.0.0',
      mylib: 'file:../mylib',
    });
    const libDir = makeTempPkg(tmp, 'mylib');

    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(cliDir, 'package.json'), 'utf-8'),
    );
    const deps = analyzeFileDeps(cliDir, pkgJson, [cliDir, libDir]);

    expect(deps).toHaveLength(1);
    expect(deps[0].name).toBe('mylib');

    fs.rmSync(tmp, { recursive: true });
  });
});

describe('resolveAllFileDeps', () => {
  it('sets publishVersion for intra-group and external deps', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-test-'));
    const libDir = makeTempPkg(tmp, 'mylib');
    const extDir = makeTempPkg(tmp, 'ext-pkg');
    const cliDir = makeTempPkg(tmp, 'mycli', {
      mylib: 'file:../mylib',
      'ext-pkg': 'file:../ext-pkg',
    });

    const entry: PackageEntry = { path: 'mycli', category: 'cli' };
    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(cliDir, 'package.json'), 'utf-8'),
    );

    const packages: ResolvedPackage[] = [
      {
        entry,
        absPath: cliDir,
        packageJson: pkgJson,
        name: 'mycli',
        fileDeps: analyzeFileDeps(cliDir, pkgJson, [libDir, cliDir]),
      },
    ];

    const resolved = resolveAllFileDeps(packages, '1.0.0-dev.0');

    const intraDep = resolved[0].fileDeps.find((d) => d.name === 'mylib');
    expect(intraDep?.publishVersion).toBe('^1.0.0-dev.0');

    const extDep = resolved[0].fileDeps.find((d) => d.name === 'ext-pkg');
    expect(extDep?.publishVersion).toBe('^0.0.1'); // version from makeTempPkg

    fs.rmSync(tmp, { recursive: true });
  });
});
