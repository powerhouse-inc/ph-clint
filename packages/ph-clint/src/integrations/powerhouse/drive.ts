/**
 * Drive management — find or create the default drive on startup.
 */

import type { DriveConfig } from './types.js';

/**
 * Ensure a drive exists. On first run, creates a new drive.
 * On subsequent runs, finds the existing one.
 *
 * @param client - IReactorClient from the built ReactorClientModule
 * @param driveConfig - Optional drive name/icon configuration
 * @returns The drive ID
 */
export async function ensureDrive(
  client: any,
  driveConfig?: DriveConfig,
): Promise<string> {
  // List existing drives
  const drives = await client.getDrives();

  if (drives && drives.length > 0) {
    return drives[0];
  }

  // Create a new drive
  const driveName = driveConfig?.name ?? 'default';
  const driveId = await client.addDrive({
    global: { name: driveName, icon: driveConfig?.icon ?? null },
    local: { availableOffline: false, sharingType: 'LOCAL', listeners: [] },
  });

  return driveId;
}
