/**
 * Merge Istanbul coverage-final.json files from ph-clint, ph-clint-dev, and
 * ph-clint-cli into a single unified report (text + lcov).
 *
 * Usage: node scripts/merge-coverage.mjs
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const sources = [
  ['ph-clint', 'ph-clint/coverage/coverage-final.json'],
  ['ph-clint-dev', 'ph-clint-dev/coverage/coverage-final.json'],
  ['ph-clint-cli', 'ph-clint-cli/ph-clint-cli/coverage/coverage-final.json'],
];

// Collect individual coverage files into a temp directory for nyc merge.
const mergeInput = resolve(root, 'tmp/.nyc_merge');
rmSync(mergeInput, { recursive: true, force: true });
mkdirSync(mergeInput, { recursive: true });

for (const [name, rel] of sources) {
  cpSync(resolve(root, rel), resolve(mergeInput, `${name}.json`));
}

// nyc merge → single combined json → nyc report
const nycOutput = resolve(root, 'tmp/.nyc_output');
rmSync(nycOutput, { recursive: true, force: true });
mkdirSync(nycOutput, { recursive: true });

execSync(`npx nyc merge ${mergeInput} ${nycOutput}/out.json`, {
  stdio: 'inherit',
  cwd: root,
});

execSync(
  `npx nyc report --temp-dir ${nycOutput} --reporter text --reporter lcov --report-dir ${resolve(root, 'tmp/coverage')}`,
  { stdio: 'inherit', cwd: root },
);

// Clean up temp dirs
rmSync(mergeInput, { recursive: true, force: true });
rmSync(nycOutput, { recursive: true, force: true });
