import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { listWebUsers } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser({ cookie: request.headers.get('cookie') || undefined });
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const userIsAdmin = await isAdmin(user.uid);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query params
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

    // Get users
    const users = await listWebUsers(limit, offset);

    // Get total count
    const snapshot = await import('@/lib/firebase-admin').then(m => 
      m.adminDb.collection(m.COLLECTIONS.WEB_USERS).count().get()
    );
    const total = snapshot.data().count;

    return NextResponse.json({
      users: users.map(u => ({
        ...u,
        createdAt: u.createdAt?.toDate().toISOString(),
        updatedAt: u.updatedAt?.toDate().toISOString(),
      })),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}