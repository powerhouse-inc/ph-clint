/**
 * Drive management — find or create the default drive on startup.
 */

import type { DriveConfig, ReactorClientModule } from './types.js';

/**
 * Ensure a drive exists. On first run, creates a new drive.
 * On subsequent runs, finds the existing one.
 *
 * The Reactor client has no `getDrives()` — drives are documents of type
 * `powerhouse/document-drive`. We use `reactor.findByType()` to locate
 * existing ones and `client.createEmpty()` + `client.rename()` to create.
 *
 * @param reactorModule - The full ReactorClientModule (needs .client and .reactor)
 * @param driveConfig - Optional drive name/icon configuration
 * @returns The drive ID
 */
export async function ensureDrive(
  reactorModule: ReactorClientModule,
  driveConfig?: DriveConfig,
): Promise<string> {
  const { client, reactor } = reactorModule;

  // Find existing document-drive documents
  const existing = await reactor.findByType('powerhouse/document-drive');
  if (existing?.results?.length && existing.results.length > 0) {
    return existing.results[0].header.id;
  }

  // Create a new drive document
  const drive = await client.createEmpty('powerhouse/document-drive');
  const driveId = drive.header.id;

  // Set the drive name
  const driveName = driveConfig?.name ?? 'default';
  if (driveName) {
    await client.rename(driveId, driveName);
  }

  return driveId;
}
