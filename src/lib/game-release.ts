export const CURRENT_GAME_FILE_NAME = 'Setup_MoonlitGarden_v0.03.exe';
export const CURRENT_GAME_VERSION_ID = 'bundled-public-v0.03';
export const CURRENT_GAME_VERSION_NUMBER = 'v0.03';
export const CURRENT_GAME_DISPLAY_NAME = 'Moonlit Garden v0.03 Setup';
export const CURRENT_GAME_TITLE = 'The Green Memoir - Early Access';
export const CURRENT_GAME_DOWNLOAD_PATH = `/game/${encodeURIComponent(CURRENT_GAME_FILE_NAME)}`;

export interface GameReleaseManifest {
  versionId: string;
  versionNumber: string;
  displayName: string;
  title: string;
  fileName: string;
  downloadPath: string;
}

export const CURRENT_GAME_RELEASE: GameReleaseManifest = {
  versionId: CURRENT_GAME_VERSION_ID,
  versionNumber: CURRENT_GAME_VERSION_NUMBER,
  displayName: CURRENT_GAME_DISPLAY_NAME,
  title: CURRENT_GAME_TITLE,
  fileName: CURRENT_GAME_FILE_NAME,
  downloadPath: CURRENT_GAME_DOWNLOAD_PATH,
};
