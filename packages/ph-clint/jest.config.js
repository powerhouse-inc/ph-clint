/**
 * Jest ESM compatibility for Powerhouse peer dependencies
 * ─────────────────────────────────────────────────────────
 *
 * Problem: Several Powerhouse transitive dependencies have broken CJS→ESM
 * chains that Jest's module runtime cannot handle:
 *
 *   document-drive → zocker/dist/index.cjs → require('@faker-js/faker')  ← ESM-only
 *   @mercuriusjs/gateway (CJS)             → require('p-map')            ← ESM-only
 *
 * When CJS code calls require() on an ESM-only package, Jest throws:
 *   "Must use import to load ES Module"
 * This happens in Jest's own Runtime.requireModule — before any transform
 * runs — so transformIgnorePatterns alone cannot fix it.
 *
 * Solution (zocker / @faker-js/faker):
 *   zocker ships both dist/index.cjs (CJS, uses require) and dist/index.js
 *   (ESM, uses import). Its package.json "main" points to the CJS entry.
 *   We use moduleNameMapper to redirect zocker → dist/index.js so the
 *   entire chain stays in ESM. Jest's ESM loader (--experimental-vm-modules)
 *   handles import('@faker-js/faker') without issues.
 *
 * Not yet solved (@mercuriusjs/gateway → p-map):
 *   @mercuriusjs/gateway is CJS-only with no ESM entry. p-map v7 is
 *   ESM-only with no CJS entry. There is no moduleNameMapper trick that
 *   fixes this — the gateway code must be loaded via a runtime that
 *   supports require() of ESM (Node 22+ native, but not Jest's runtime).
 *   Tests that exercise startSwitchboard() are skipped in Jest;
 *   the pure logic was extracted into buildSwitchboardInstance() and
 *   tested directly. Full integration tests are planned via c8 + node:test
 *   outside Jest (see specs/plans/unified-coverage.md Part 3).
 *
 * pnpm note:
 *   pnpm hoists packages into a virtual store with paths like:
 *     node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>/dist/index.js
 *   or in the global store:
 *     ~/.local/share/pnpm/global/5/.pnpm/<pkg>@<ver>/node_modules/<pkg>/...
 *   Paths contain multiple /node_modules/ segments. The transformIgnorePatterns
 *   regex uses a lookahead that scans the full remaining path for the package
 *   name, so it works regardless of store location.
 *
 * If you add a new Powerhouse peer dep that has a similar CJS→ESM break:
 *   1. Check if the package ships a dual CJS/ESM build (look for .cjs + .js
 *      in dist/). If so, add a moduleNameMapper entry pointing to the ESM.
 *   2. If not, extract the testable logic into a pure function (like
 *      buildSwitchboardInstance) and test that. Add the package to the
 *      c8-based integration test runner when Part 3 is implemented.
 *   3. Add the package name to transformIgnorePatterns so Jest transforms
 *      its JS files when encountered indirectly.
 */

/** @type {import('jest').Config} */
export default {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json',
    }],
    // Transform .js/.mjs files from allowlisted ESM-only packages (see above).
    '.+\\.m?js$': ['ts-jest', {
      useESM: true,
      tsconfig: { module: 'nodenext', allowJs: true },
    }],
  },
  // Only transform ESM-only packages that appear in CJS→ESM chains (see above).
  // The (?!.*<pkg>) lookahead scans the full path so it matches both local and
  // global pnpm store locations.
  transformIgnorePatterns: [
    '/node_modules/(?!.*(@faker-js/faker|p-map|zocker)/)',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Redirect zocker to its ESM entry (see comment block above for rationale).
    '^zocker$': 'zocker/dist/index.js',
  },
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx', '**/tests/**/*.integration.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx', '!src/interactive/*.tsx', '!src/testing/**', '!src/**/*.d.ts', '!src/integrations/powerhouse/connect-server.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json'],
  coverageThreshold: {
    global: {
      statements: 93.5,
      branches: 85.5,
      functions: 91.5,
      lines: 95,
    },
  },
};
