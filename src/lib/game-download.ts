import { existsSync, statSync } from 'fs';
import { join } from 'path';

const BUNDLED_GAME_FILE_NAME = 'The Green Memoir_v0.01.rar';
const BUNDLED_GAME_VERSION_ID = 'bundled-public-v0.01';
const BUNDLED_GAME_VERSION_NUMBER = 'v0.01';
const BUNDLED_GAME_DISPLAY_NAME = 'The Green Memoir v0.01';
const BUNDLED_GAME_DOWNLOAD_URL = `/game/${encodeURIComponent(BUNDLED_GAME_FILE_NAME)}`;

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
  const filePath = join(process.cwd(), 'public', 'game', BUNDLED_GAME_FILE_NAME);
  if (!existsSync(filePath)) {
    return null;
  }

  return {
    versionId: BUNDLED_GAME_VERSION_ID,
    versionNumber: BUNDLED_GAME_VERSION_NUMBER,
    displayName: BUNDLED_GAME_DISPLAY_NAME,
    downloadUrl: BUNDLED_GAME_DOWNLOAD_URL,
    fileSize: statSync(filePath).size,
    checksum: '',
    changelog: '',
  };
}
