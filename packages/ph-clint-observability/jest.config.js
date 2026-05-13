export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: { module: 'esnext', target: 'es2022', moduleResolution: 'bundler' } }],
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  // Exclude the bin entry from coverage — it's pure wiring (parse args, call
  // startDevServer, install signal handlers) that can't be exercised without
  // booting a real server. The library it imports is fully covered.
  collectCoverageFrom: ['src/**/*.ts', '!src/bin/**'],
  coverageThreshold: {
    global: { statements: 80, branches: 70, functions: 80, lines: 80 },
  },
};
