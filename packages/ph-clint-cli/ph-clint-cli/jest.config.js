/** @type {import('jest').Config} */
export default {
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
    // Transform ESM-only packages in CJS→ESM chains (zocker → @faker-js/faker).
    '.+\\.m?js$': ['ts-jest', {
      useESM: true,
      tsconfig: { module: 'nodenext', allowJs: true },
    }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!.*(@faker-js/faker|zocker)/)',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Redirect zocker to its ESM entry to avoid CJS require() of ESM-only @faker-js/faker.
    '^zocker$': 'zocker/dist/index.js',
  },
  testMatch: ['**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/', '/tests/codegen-e2e/'],
};
