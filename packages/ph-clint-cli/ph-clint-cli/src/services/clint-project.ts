import fs from 'node:fs';
import path from 'node:path';
import { defineService, checkWorkdir } from '@powerhousedao/ph-clint';

export const clintProject = defineService({
  id: 'clint-project',
  name: 'Clint Project',
  description: 'Development server for a ph-clint implementation project',

  command: () => 'pnpm dev',

  readiness: {
    patterns: [{
      name: 'cli-ready',
      pattern: /Interactive mode started|ready/i,
      captures: {},
    }],
    timeout: 30_000,
  },

  preflight: [
    checkWorkdir(
      (cwd) => {
        const pkg = path.join(cwd, 'package.json');
        if (!fs.existsSync(pkg)) return false;
        try {
          const json = JSON.parse(fs.readFileSync(pkg, 'utf8'));
          return !!json.dependencies?.['@powerhousedao/ph-clint']
              || !!json.scripts?.dev;
        } catch { return false; }
      },
      'Not a ph-clint project directory',
      'Use --workdir to point to a ph-clint project root',
    ),
  ],

  projectScanner: {
    isProjectFolder: (p) => {
      const pkg = path.join(p, 'package.json');
      if (!fs.existsSync(pkg)) return false;
      try {
        const json = JSON.parse(fs.readFileSync(pkg, 'utf8'));
        return !!json.dependencies?.['@powerhousedao/ph-clint'];
      } catch { return false; }
    },
  },

  restart: { enabled: false, maxRetries: 0, delay: 0 },
});
