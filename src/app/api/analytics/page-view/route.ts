import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, COLLECTIONS } from '@/lib/firebase-admin';
import { getVietnamDateKey } from '@/lib/date';

const VISITOR_COOKIE = 'tgm_visitor_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function buildVisitorId() {
  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  try {
    const { pathname } = await request.json().catch(() => ({ pathname: '' }));
    const normalizedPathname = typeof pathname === 'string' ? pathname.trim() : '';

    if (!normalizedPathname || normalizedPathname.startsWith('/api')) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const dateKey = getVietnamDateKey();
    const visitorCookie = request.cookies.get(VISITOR_COOKIE)?.value;
    const visitorId = visitorCookie || buildVisitorId();
    const pageRef = adminDb.collection(COLLECTIONS.SITE_STATS).doc(dateKey);
    const uniqueVisitorField = `visitorIds.${visitorId}`;

    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(pageRef);
      const alreadyCounted = snapshot.get(uniqueVisitorField) === true;

      transaction.set(
        pageRef,
        {
          date: dateKey,
          pageViews: FieldValue.increment(1),
          uniqueVisitors: FieldValue.increment(alreadyCounted ? 0 : 1),
          [uniqueVisitorField]: true,
        },
        { merge: true }
      );
    });

    const response = NextResponse.json({ success: true });
    if (!visitorCookie) {
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch (error: any) {
    console.error('Page view tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track page view' },
      { status: 500 }
    );
  }
}
