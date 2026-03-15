import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { listGameVersions, createGameVersion, getGameVersion, updateGameVersion } from '@/lib/firestore';
import { Timestamp } from 'firebase-admin/firestore';

// GET - List all versions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser({ cookie: request.headers.get('cookie') || undefined });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(user.uid);
    if (!userIsAdmin) {
      // Non-admin users can only see active versions
      const versions = await listGameVersions(50);
      return NextResponse.json({
        versions: versions
          .filter(v => v.isActive)
          .map(v => ({
            id: v.id,
            ...v,
            createdAt: v.createdAt?.toDate().toISOString(),
          })),
      });
    }

    // Admin sees all versions
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const versions = await listGameVersions(limit);

    return NextResponse.json({
      versions: versions.map(v => ({
        id: v.id,
        ...v,
        createdAt: v.createdAt?.toDate().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Admin versions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// POST - Create new version (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser({ cookie: request.headers.get('cookie') || undefined });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(user.uid);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      versionNumber,
      displayName,
      changelog,
      downloadUrl,
      fileSize,
      checksum,
      isLatest,
      isActive,
    } = body;

    // Validate required fields
    if (!versionNumber || !displayName || !downloadUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const version = await createGameVersion({
      versionNumber,
      displayName,
      changelog: changelog || '',
      downloadUrl,
      fileSize: fileSize || 0,
      checksum: checksum || '',
      isLatest: isLatest || false,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({
      id: version.id,
      ...version,
      createdAt: version.createdAt?.toDate().toISOString(),
    });
  } catch (error: any) {
    console.error('Create version error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create version' },
      { status: 500 }
    );
  }
}