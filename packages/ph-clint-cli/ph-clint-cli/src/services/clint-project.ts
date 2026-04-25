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

    getDocumentLink: (p) => {
      const specPath = path.join(p, '.ph', 'ph-clint-cli', 'project-spec.json');
      if (!fs.existsSync(specPath)) return undefined;
      try {
        const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
        if (spec.documentId) {
          return {
            documentId: spec.documentId,
            documentType: spec.documentType ?? 'powerhouse/ph-clint-project',
          };
        }
      } catch { /* noop */ }
      return undefined;
    },
  },

  restart: { enabled: false, maxRetries: 0, delay: 0 },
});
