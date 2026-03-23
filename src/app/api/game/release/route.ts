import { NextRequest, NextResponse } from 'next/server';
import { CURRENT_GAME_RELEASE } from '@/lib/game-release';

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  return NextResponse.json({
    ...CURRENT_GAME_RELEASE,
    downloadUrl: `${origin}${CURRENT_GAME_RELEASE.downloadPath}`,
  });
}
