/**
 * Builds `tsconfig.json` for the CLI.
 */
export function buildTsconfigJson(): string {
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'Node16',
      moduleResolution: 'Node16',
      outDir: 'dist',
      rootDir: 'src',
      strict: true,
      isolatedModules: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
      types: ['node'],
    },
    include: ['src'],
  };
  return JSON.stringify(tsconfig, null, 2) + '\n';
}
