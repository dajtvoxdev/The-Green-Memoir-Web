import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { adminAuth, adminDb, COLLECTIONS } from '@/lib/firebase-admin';
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
        disabled: u.disabled || false,
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

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser({ cookie: request.headers.get('cookie') || undefined });
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userIsAdmin = await isAdmin(user.uid);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const uid = typeof body.uid === 'string' ? body.uid.trim() : '';
    const disabled = typeof body.disabled === 'boolean' ? body.disabled : null;
    const role = body.role === 'admin' ? 'admin' : null;

    if (!uid) {
      return NextResponse.json(
        { error: 'uid is required' },
        { status: 400 }
      );
    }

    if (disabled === null && role === null) {
      return NextResponse.json(
        { error: 'disabled must be a boolean or role must be admin' },
        { status: 400 }
      );
    }

    if (uid === user.uid && disabled) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own admin account' },
        { status: 400 }
      );
    }

    if (disabled !== null) {
      await adminAuth.updateUser(uid, { disabled });

      if (disabled) {
        await adminAuth.revokeRefreshTokens(uid);
      }
    }

    if (role === 'admin') {
      const userRecord = await adminAuth.getUser(uid);
      await adminAuth.setCustomUserClaims(uid, { ...(userRecord.customClaims || {}), role: 'admin' });
    }

    await adminDb.collection(COLLECTIONS.WEB_USERS).doc(uid).set({
      ...(disabled !== null ? { disabled } : {}),
      ...(role === 'admin' ? { role: 'admin' } : {}),
      updatedAt: Timestamp.now(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      uid,
      disabled,
      role,
      message:
        role === 'admin'
          ? 'User promoted to admin'
          : disabled
            ? 'User account deactivated'
            : 'User account reactivated',
    });
  } catch (error: any) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
