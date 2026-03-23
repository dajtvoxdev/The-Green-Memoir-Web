import { existsSync, statSync } from 'fs';
import { join } from 'path';
import {
  CURRENT_GAME_FILE_NAME,
  CURRENT_GAME_RELEASE,
} from '@/lib/game-release';

export interface BundledGameDownload {
  versionId: string;
  versionNumber: string;
  displayName: string;
  downloadUrl: string;
  fileSize: number;
  checksum: string;
  changelog: string;
}

export function getBundledGameDownload(): BundledGameDownload | null {
  const filePath = join(process.cwd(), 'public', 'game', CURRENT_GAME_FILE_NAME);
  if (!existsSync(filePath)) {
    return null;
  }

  return {
    versionId: CURRENT_GAME_RELEASE.versionId,
    versionNumber: CURRENT_GAME_RELEASE.versionNumber,
    displayName: CURRENT_GAME_RELEASE.displayName,
    downloadUrl: CURRENT_GAME_RELEASE.downloadPath,
    fileSize: statSync(filePath).size,
    checksum: '',
    changelog: '',
  };
}
