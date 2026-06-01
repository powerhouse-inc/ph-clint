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

  it('classifies workspace: deps as intra-group', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-test-'));
    const cliDir = makeTempPkg(tmp, 'mycli', {
      mylib: 'workspace:*',
    });

    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(cliDir, 'package.json'), 'utf-8'),
    );
    const deps = analyzeFileDeps(cliDir, pkgJson, [cliDir]);

    expect(deps).toHaveLength(1);
    expect(deps[0].name).toBe('mylib');
    expect(deps[0].intraGroup).toBe(true);
    expect(deps[0].originalSpecifier).toBe('workspace:*');
    expect(deps[0].field).toBe('dependencies');

    fs.rmSync(tmp, { recursive: true });
  });

  it('handles workspace:^ specifiers', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-test-'));
    const cliDir = makeTempPkg(tmp, 'mycli', {
      mylib: 'workspace:^',
    });

    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(cliDir, 'package.json'), 'utf-8'),
    );
    const deps = analyzeFileDeps(cliDir, pkgJson, [cliDir]);

    expect(deps).toHaveLength(1);
    expect(deps[0].intraGroup).toBe(true);
    expect(deps[0].originalSpecifier).toBe('workspace:^');

    fs.rmSync(tmp, { recursive: true });
  });

  it('handles peerDependencies with workspace:', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-test-'));
    const pkgDir = path.join(tmp, 'mypkg');
    fs.mkdirSync(pkgDir, { recursive: true });
    const pkgJson = {
      name: 'mypkg',
      version: '0.0.1',
      peerDependencies: { mylib: 'workspace:*' },
    };
    fs.writeFileSync(
      path.join(pkgDir, 'package.json'),
      JSON.stringify(pkgJson, null, 2),
    );

    const deps = analyzeFileDeps(pkgDir, pkgJson, [pkgDir]);

    expect(deps).toHaveLength(1);
    expect(deps[0].name).toBe('mylib');
    expect(deps[0].intraGroup).toBe(true);
    expect(deps[0].field).toBe('peerDependencies');

    fs.rmSync(tmp, { recursive: true });
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

  it('classifies catalog: deps as external, resolving to node_modules', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-test-'));
    const cliDir = makeTempPkg(tmp, 'mycli', {
      'default-cat': 'catalog:',
      'named-cat': 'catalog:foo',
    });
    // catalog: deps resolve to the version pnpm installed into node_modules
    makeTempPkg(path.join(cliDir, 'node_modules'), 'default-cat');
    makeTempPkg(path.join(cliDir, 'node_modules'), 'named-cat');

    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(cliDir, 'package.json'), 'utf-8'),
    );
    const deps = analyzeFileDeps(cliDir, pkgJson, [cliDir]);

    expect(deps).toHaveLength(2);
    for (const dep of deps) {
      expect(dep.intraGroup).toBe(false);
      expect(dep.resolvedPath).toBe(
        path.resolve(cliDir, 'node_modules', dep.name),
      );
    }

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

  it('pins catalog: deps to the installed version', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-test-'));
    const cliDir = makeTempPkg(tmp, 'mycli', { 'cat-pkg': 'catalog:' });
    // Installed version differs from makeTempPkg's default to prove it's read
    const nmDir = path.join(cliDir, 'node_modules', 'cat-pkg');
    fs.mkdirSync(nmDir, { recursive: true });
    fs.writeFileSync(
      path.join(nmDir, 'package.json'),
      JSON.stringify({ name: 'cat-pkg', version: '2.3.4' }),
    );

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
        fileDeps: analyzeFileDeps(cliDir, pkgJson, [cliDir]),
      },
    ];

    const resolved = resolveAllFileDeps(packages, '1.0.0-dev.0');
    const catDep = resolved[0].fileDeps.find((d) => d.name === 'cat-pkg');
    expect(catDep?.publishVersion).toBe('^2.3.4');

    fs.rmSync(tmp, { recursive: true });
  });
});
