import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, COLLECTIONS } from '@/lib/firebase-admin';

/**
 * POST /api/admin/setup
 * One-time admin setup endpoint.
 * Promotes a user to admin role by email.
 * Secured by ADMIN_SETUP_SECRET env variable.
 *
 * Body: { email: string, secret: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, secret } = await request.json();

    // Validate secret
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    if (!setupSecret) {
      return NextResponse.json(
        { error: 'Admin setup is not configured. Set ADMIN_SETUP_SECRET env variable.' },
        { status: 503 }
      );
    }

    if (!secret || secret !== setupSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email in Firebase Auth
    const userRecord = await adminAuth.getUserByEmail(email);
    const uid = userRecord.uid;

    // Set admin custom claims
    await adminAuth.setCustomUserClaims(uid, { role: 'admin' });

    // Update Firestore webUsers record
    const userDoc = adminDb.collection(COLLECTIONS.WEB_USERS).doc(uid);
    const docSnap = await userDoc.get();

    if (docSnap.exists) {
      await userDoc.update({ role: 'admin' });
    } else {
      const { Timestamp } = await import('firebase-admin/firestore');
      await userDoc.set({
        email: userRecord.email || '',
        displayName: userRecord.displayName || null,
        role: 'admin',
        hasPurchased: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} (${uid}) promoted to admin`,
    });
  } catch (error: any) {
    console.error('Admin setup error:', error);

    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'User not found. Make sure they have registered first.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to setup admin' },
      { status: 500 }
    );
  }
}
