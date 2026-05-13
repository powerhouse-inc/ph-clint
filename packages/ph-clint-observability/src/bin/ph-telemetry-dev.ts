#!/usr/bin/env node
/**
 * ph-telemetry-dev — bin entry.
 *
 * Imports the library and runs the receiver unconditionally. Splitting bin
 * from library means the library has no side effects on import (so tests
 * can pull in startDevServer/parseCliArgs/envPrefix without booting a
 * server), and the bin file doesn't need a fragile
 * `import.meta.url === <path>` guard.
 */
import { parseCliArgs, startDevServer } from '../dev-server.js';

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv);
  const handle = await startDevServer(args);
  process.once('SIGINT', () => { void handle.close().then(() => process.exit(0)); });
  process.once('SIGTERM', () => { void handle.close().then(() => process.exit(0)); });
}

main().catch((err: unknown) => {
  process.stderr.write(
    `ph-telemetry-dev: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
