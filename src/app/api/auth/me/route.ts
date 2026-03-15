import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getWebUser } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser({ cookie: request.headers.get('cookie') || undefined });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get web user data from Firestore
    const webUser = await getWebUser(user.uid);

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      displayName: webUser?.displayName || user.name || null,
      hasPurchased: webUser?.hasPurchased || false,
      role: webUser?.role || 'user',
      createdAt: webUser?.createdAt?.toDate().toISOString() || null,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user info' },
      { status: 500 }
    );
  }
}