import { NextRequest, NextResponse } from 'next/server';
import { getDownloadToken, markTokenAsUsed, getGameVersion } from '@/lib/firestore';

/**
 * Download game file using token
 * 
 * This endpoint:
 * 1. Validates the download token
 * 2. Checks if token is expired
 * 3. Marks token as used (single-use token)
 * 4. Redirects to actual download URL or streams the file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Get download token from database
    const downloadToken = await getDownloadToken(token);
    
    if (!downloadToken) {
      return NextResponse.json(
        { error: 'Invalid download token' },
        { status: 404 }
      );
    }

    // Check if already used
    if (downloadToken.usedAt) {
      return NextResponse.json(
        { error: 'This download token has already been used' },
        { status: 400 }
      );
    }

    // Check if expired
    const now = new Date();
    if (now > downloadToken.expiresAt.toDate()) {
      return NextResponse.json(
        { error: 'Download token has expired' },
        { status: 400 }
      );
    }

    // Get game version
    const version = await getGameVersion(downloadToken.versionId);
    if (!version) {
      return NextResponse.json(
        { error: 'Game version not found' },
        { status: 404 }
      );
    }

    // Mark token as used
    await markTokenAsUsed(downloadToken.id!);

    // Redirect to actual download URL
    // In production, this could be a signed Firebase Storage URL or CDN URL
    return NextResponse.redirect(version.downloadUrl);
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process download' },
      { status: 500 }
    );
  }
}