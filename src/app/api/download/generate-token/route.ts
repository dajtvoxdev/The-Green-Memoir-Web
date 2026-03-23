import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getWebUser, createDownloadToken, getLatestGameVersion } from '@/lib/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { randomBytes } from 'crypto';
import { getBundledGameDownload } from '@/lib/game-download';

const DOWNLOAD_TOKEN_EXPIRY_HOURS = parseInt(process.env.DOWNLOAD_TOKEN_EXPIRY_HOURS || '24', 10);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser({ cookie: request.headers.get('cookie') || undefined });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      );
    }

    // Check if user has purchased
    const webUser = await getWebUser(user.uid);
    if (!webUser?.hasPurchased) {
      return NextResponse.json(
        { error: 'You need to purchase the game first.' },
        { status: 403 }
      );
    }

    // Prefer the bundled public build when it exists so download links
    // automatically track the latest uploaded archive in /public/game.
    const bundledVersion = getBundledGameDownload();
    const firestoreVersion = bundledVersion ? null : await getLatestGameVersion();
    const version = bundledVersion || firestoreVersion;

    if (!version || ('isActive' in version && !version.isActive)) {
      return NextResponse.json(
        { error: 'No game version available for download.' },
        { status: 404 }
      );
    }

    // Generate secure random token
    const token = randomBytes(32).toString('hex');

    // Create download token record
    const downloadToken = await createDownloadToken({
      userId: user.uid,
      token,
      versionId: bundledVersion ? bundledVersion.versionId : firestoreVersion!.id!,
      expiresAt: Timestamp.fromDate(
        new Date(Date.now() + DOWNLOAD_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
      ),
    });

    return NextResponse.json({
      token: downloadToken.token,
      version: {
        versionNumber: version.versionNumber,
        displayName: version.displayName,
        fileSize: version.fileSize,
        checksum: version.checksum,
        changelog: version.changelog,
      },
      downloadUrl: `/api/download/${downloadToken.token}`,
      expiresAt: downloadToken.expiresAt.toDate().toISOString(),
    });
  } catch (error: any) {
    console.error('Generate token error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate download token' },
      { status: 500 }
    );
  }
}
