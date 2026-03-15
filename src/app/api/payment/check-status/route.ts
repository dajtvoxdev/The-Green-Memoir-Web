import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrderById, getWebUser } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser({ cookie: request.headers.get('cookie') || undefined });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to user
    if (order.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if order is expired
    const now = new Date();
    const isExpired = now > order.expiresAt.toDate();
    
    if (isExpired && order.status === 'pending') {
      return NextResponse.json({
        status: 'expired',
        order: {
          id: order.id,
          orderCode: order.orderCode,
          status: 'expired',
          expiresAt: order.expiresAt.toDate().toISOString(),
        },
      });
    }

    // Check if paid - also verify with web user status
    let hasPurchased = order.status === 'paid';
    if (hasPurchased) {
      const webUser = await getWebUser(user.uid);
      hasPurchased = webUser?.hasPurchased || false;
    }

    return NextResponse.json({
      status: order.status,
      hasPurchased,
      order: {
        id: order.id,
        orderCode: order.orderCode,
        status: order.status,
        amount: order.amount,
        paidAt: order.paidAt?.toDate().toISOString() || null,
        expiresAt: order.expiresAt.toDate().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Check status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check order status' },
      { status: 500 }
    );
  }
}