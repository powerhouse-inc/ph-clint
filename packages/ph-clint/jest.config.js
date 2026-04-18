/** @type {import('jest').Config} */
export default {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json',
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx', '**/tests/**/*.integration.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx', '!src/interactive/*.tsx', '!src/testing/**', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 83,
      functions: 92,
      lines: 91,
    },
  },
};
