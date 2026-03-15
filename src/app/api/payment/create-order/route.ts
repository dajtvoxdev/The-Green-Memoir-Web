import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createOrder, getWebUser } from '@/lib/firestore';
import { generateOrderCode, buildQRUrl, getOrderExpirationDate } from '@/lib/sepay';
import { Timestamp } from 'firebase-admin/firestore';

const GAME_PRICE = parseInt(process.env.GAME_PRICE || '49000', 10);

export async function POST(request: NextRequest) {
  try {
    // Get current user from session cookie
    const user = await getCurrentUser({ cookie: request.headers.get('cookie') || undefined });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      );
    }

    const uid = user.uid;

    // Check if user already purchased
    const webUser = await getWebUser(uid);
    if (webUser?.hasPurchased) {
      return NextResponse.json(
        { error: 'You have already purchased this game.' },
        { status: 400 }
      );
    }

    // Generate unique order code
    const orderCode = generateOrderCode();

    // Create order in Firestore
    const order = await createOrder({
      userId: uid,
      userEmail: user.email || '',
      orderCode,
      amount: GAME_PRICE,
      status: 'pending',
      sepayId: null,
      referenceCode: null,
      paidAt: null,
      expiresAt: Timestamp.fromDate(getOrderExpirationDate()),
    });

    // Build QR URL
    const qrUrl = buildQRUrl({
      accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || '',
      bankCode: process.env.SEPAY_BANK_CODE || 'VCB',
      amount: GAME_PRICE,
      orderCode,
    });

    return NextResponse.json({
      orderId: order.id,
      orderCode,
      amount: GAME_PRICE,
      qrUrl,
      expiresAt: order.expiresAt.toDate().toISOString(),
      bankInfo: {
        bank: process.env.SEPAY_BANK_CODE || 'VCB',
        accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || '',
        accountName: process.env.SEPAY_ACCOUNT_NAME || '',
      },
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}