import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, clearSessionCookieHeader, createSessionCookieHeader } from '@/lib/auth';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { idToken, rememberMe } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Create session cookie
    const sessionCookie = await createSessionCookie(idToken);

    // Check if user exists in Firestore, if not create web user record
    const userDoc = await adminDb.collection(COLLECTIONS.WEB_USERS).doc(uid).get();
    
    if (!userDoc.exists) {
      // Get user record from Firebase Auth
      const authUser = await adminAuth.getUser(uid);
      
      // Create web user record
      await adminDb.collection(COLLECTIONS.WEB_USERS).doc(uid).set({
        email: authUser.email || '',
        displayName: authUser.displayName || null,
        role: 'user',
        hasPurchased: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Also sync to RTDB for game access
      await adminAuth.setCustomUserClaims(uid, { role: 'user' });
    }

    // Set cookie header
    const cookieHeader = createSessionCookieHeader(sessionCookie);

    return NextResponse.json(
      { success: true, uid },
      {
        headers: {
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (error: any) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieHeader = clearSessionCookieHeader();

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to logout' },
      { status: 500 }
    );
  }
}