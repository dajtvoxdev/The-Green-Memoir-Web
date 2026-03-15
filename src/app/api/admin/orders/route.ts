import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { listOrders, getOrdersByStatus, getOrdersByUserId } from '@/lib/firestore';

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
      // Allow user to fetch their own orders
      const userId = request.nextUrl.searchParams.get('userId');
      if (userId === user.uid) {
        const orders = await getOrdersByUserId(userId, 50);
        return NextResponse.json({
          orders: orders.map(o => ({
            id: o.id,
            ...o,
            createdAt: o.createdAt?.toDate().toISOString(),
            paidAt: o.paidAt?.toDate().toISOString(),
          })),
        });
      }
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query params
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);
    const status = request.nextUrl.searchParams.get('status') as 'pending' | 'paid' | 'failed' | 'expired' | null;
    const userId = request.nextUrl.searchParams.get('userId');

    let orders;
    if (userId) {
      orders = await getOrdersByUserId(userId, limit);
    } else if (status) {
      orders = await getOrdersByStatus(status, limit);
    } else {
      orders = await listOrders(limit, offset);
    }

    return NextResponse.json({
      orders: orders.map(o => ({
        id: o.id,
        ...o,
        createdAt: o.createdAt?.toDate().toISOString(),
        paidAt: o.paidAt?.toDate().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Admin orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}