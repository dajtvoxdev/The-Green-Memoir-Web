import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { listOrders, getOrdersByStatus, getOrdersByUserId, type Order } from '@/lib/firestore';
import { adminDb, adminRtdb, COLLECTIONS, RTDB_PATHS } from '@/lib/firebase-admin';
import { generateOrderCode } from '@/lib/sepay';

const GAME_PRICE = parseInt(process.env.GAME_PRICE || '49000', 10);
const MAX_SEED_COUNT = 100;
const DEFAULT_SEED_COUNT = 20;
const ORDER_STATUSES: Order['status'][] = [
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'pending',
  'pending',
  'pending',
  'pending',
  'failed',
  'failed',
  'expired',
  'expired',
];

const FAKE_CUSTOMERS = [
  { displayName: 'Nguyen Minh Anh', email: 'minh.anh.nguyen@gmail.com' },
  { displayName: 'Tran Gia Huy', email: 'giahuy.tran@outlook.com' },
  { displayName: 'Le Bao Chau', email: 'bao.chau.le@gmail.com' },
  { displayName: 'Pham Quynh Nhu', email: 'quynhnhu.pham@gmail.com' },
  { displayName: 'Vo Hoang Long', email: 'hoanglong.vo@yahoo.com' },
  { displayName: 'Dang Thu Ha', email: 'thuha.dang@gmail.com' },
  { displayName: 'Bui Duc Manh', email: 'ducmanh.bui@gmail.com' },
  { displayName: 'Do Khanh Linh', email: 'khanhlinh.do@icloud.com' },
  { displayName: 'Phan Tuan Kiet', email: 'tuankiet.phan@gmail.com' },
  { displayName: 'Huynh My Tien', email: 'mytien.huynh@gmail.com' },
  { displayName: 'Ngo Thanh Dat', email: 'thanhdat.ngo@gmail.com' },
  { displayName: 'Cao Nhat Vy', email: 'nhatvy.cao@outlook.com' },
  { displayName: 'Duong Gia Bao', email: 'giabao.duong@gmail.com' },
  { displayName: 'Truong Kim Ngan', email: 'kimngan.truong@gmail.com' },
  { displayName: 'Mai Quoc Bao', email: 'quocbao.mai@gmail.com' },
  { displayName: 'Lam Thao Nguyen', email: 'thaonguyen.lam@gmail.com' },
  { displayName: 'Vu Tien Phat', email: 'tienphat.vu@yahoo.com' },
  { displayName: 'Hoang Anh Thu', email: 'anhthu.hoang@gmail.com' },
  { displayName: 'Ton That Minh Tri', email: 'minhtri.tonthat@gmail.com' },
  { displayName: 'Nguyen Bao Tram', email: 'baotram.nguyen@icloud.com' },
];

function serializeOrder(order: Order) {
  return {
    id: order.id,
    ...order,
    createdAt: order.createdAt?.toDate().toISOString(),
    paidAt: order.paidAt?.toDate().toISOString() || null,
    expiresAt: order.expiresAt?.toDate().toISOString(),
  };
}

async function requireAdmin(request: NextRequest) {
  const user = await getCurrentUser({ cookie: request.headers.get('cookie') || undefined });
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  const userIsAdmin = await isAdmin(user.uid);
  if (!userIsAdmin) {
    return {
      user,
      error: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { user };
}

function clampSeedCount(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : parseInt(String(value ?? DEFAULT_SEED_COUNT), 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_SEED_COUNT) {
    return null;
  }
  return parsed;
}

function getStatusForIndex(index: number): Order['status'] {
  return ORDER_STATUSES[index % ORDER_STATUSES.length];
}

function buildFakeCustomer(index: number) {
  const base = FAKE_CUSTOMERS[index % FAKE_CUSTOMERS.length];
  const cycle = Math.floor(index / FAKE_CUSTOMERS.length);

  if (cycle === 0) {
    return base;
  }

  const [localPart, domain] = base.email.split('@');
  return {
    displayName: `${base.displayName} ${cycle + 1}`,
    email: `${localPart}+${cycle + 1}@${domain}`,
  };
}

function buildReferenceCode(batchLabel: string, index: number, createdAt: Date) {
  const compactDate = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  return `FT${compactDate}${batchLabel.slice(-4)}${String(index + 1).padStart(3, '0')}`;
}

function buildSeedTimeline(status: Order['status'], now: Date, index: number) {
  const baseCreatedAt = new Date(now);

  if (status === 'paid') {
    baseCreatedAt.setDate(baseCreatedAt.getDate() - (index % 12));
    baseCreatedAt.setHours(9 + (index % 8), (index * 7) % 60, 0, 0);
    const paidAt = new Date(baseCreatedAt.getTime() + (4 + (index % 11)) * 60 * 1000);
    const expiresAt = new Date(baseCreatedAt.getTime() + 30 * 60 * 1000);
    return { createdAt: baseCreatedAt, paidAt, expiresAt };
  }

  if (status === 'pending') {
    baseCreatedAt.setHours(baseCreatedAt.getHours() - (index % 5), 5 + (index * 9) % 60, 0, 0);
    const expiresAt = new Date(baseCreatedAt.getTime() + 30 * 60 * 1000);
    return { createdAt: baseCreatedAt, paidAt: null, expiresAt };
  }

  if (status === 'failed') {
    baseCreatedAt.setDate(baseCreatedAt.getDate() - (2 + (index % 6)));
    baseCreatedAt.setHours(18 + (index % 4), 10 + (index * 5) % 45, 0, 0);
    const expiresAt = new Date(baseCreatedAt.getTime() + 30 * 60 * 1000);
    return { createdAt: baseCreatedAt, paidAt: null, expiresAt };
  }

  baseCreatedAt.setDate(baseCreatedAt.getDate() - (1 + (index % 4)));
  baseCreatedAt.setHours(7 + (index % 5), 15 + (index * 3) % 40, 0, 0);
  const expiresAt = new Date(baseCreatedAt.getTime() + 30 * 60 * 1000);
  return { createdAt: baseCreatedAt, paidAt: null, expiresAt };
}

async function seedFakeOrders(count: number) {
  const now = new Date();
  const batchLabel = `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  const batch = adminDb.batch();
  const rtdbPayload: Record<string, boolean> = {};
  const seededOrders: Order[] = [];
  let paidCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let expiredCount = 0;

  for (let index = 0; index < count; index += 1) {
    const status = getStatusForIndex(index);
    const customer = buildFakeCustomer(index);
    const userId = `seed-${batchLabel.toLowerCase()}-${String(index + 1).padStart(3, '0')}`;
    const userRef = adminDb.collection(COLLECTIONS.WEB_USERS).doc(userId);
    const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc();
    const timeline = buildSeedTimeline(status, now, index);
    const createdAt = Timestamp.fromDate(timeline.createdAt);
    const paidAt = timeline.paidAt ? Timestamp.fromDate(timeline.paidAt) : null;
    const expiresAt = Timestamp.fromDate(timeline.expiresAt);
    const orderCode = generateOrderCode();
    const hasPurchased = status === 'paid';

    if (status === 'paid') paidCount += 1;
    if (status === 'pending') pendingCount += 1;
    if (status === 'failed') failedCount += 1;
    if (status === 'expired') expiredCount += 1;

    batch.set(userRef, {
      email: customer.email,
      displayName: customer.displayName,
      role: 'user',
      hasPurchased,
      createdAt: Timestamp.fromDate(new Date(timeline.createdAt.getTime() - (index % 7 + 1) * 24 * 60 * 60 * 1000)),
      updatedAt: paidAt || createdAt,
    });

    const order: Order = {
      id: orderRef.id,
      userId,
      userEmail: customer.email,
      orderCode,
      amount: GAME_PRICE,
      status,
      sepayId: hasPurchased ? 8200000 + index * 17 + Math.floor(now.getTime() % 1000) : null,
      referenceCode: hasPurchased ? buildReferenceCode(batchLabel, index, timeline.createdAt) : null,
      paidAt,
      expiresAt,
      createdAt,
    };

    batch.set(orderRef, {
      userId: order.userId,
      userEmail: order.userEmail,
      orderCode: order.orderCode,
      amount: order.amount,
      status: order.status,
      sepayId: order.sepayId,
      referenceCode: order.referenceCode,
      paidAt: order.paidAt,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
    });

    seededOrders.push(order);
    rtdbPayload[RTDB_PATHS.USER_HAS_PURCHASED(userId)] = hasPurchased;
  }

  await batch.commit();

  if (Object.keys(rtdbPayload).length > 0) {
    await adminRtdb.ref().update(rtdbPayload);
  }

  seededOrders.sort((left, right) => right.createdAt.toMillis() - left.createdAt.toMillis());

  return {
    batchLabel,
    orders: seededOrders,
    summary: {
      total: count,
      paid: paidCount,
      pending: pendingCount,
      failed: failedCount,
      expired: expiredCount,
      amountPerOrder: GAME_PRICE,
      totalRevenue: paidCount * GAME_PRICE,
    },
  };
}

async function syncPurchaseStatusForUser(userId: string) {
  const ordersSnapshot = await adminDb.collection(COLLECTIONS.ORDERS)
    .where('userId', '==', userId)
    .get();

  const hasPurchased = ordersSnapshot.docs.some((doc) => {
    const data = doc.data() as Partial<Order>;
    return data.status === 'paid';
  });

  await Promise.all([
    adminDb.collection(COLLECTIONS.WEB_USERS).doc(userId).set(
      {
        hasPurchased,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    ),
    adminRtdb.ref(RTDB_PATHS.USER_HAS_PURCHASED(userId)).set(hasPurchased),
  ]);
}

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
          orders: orders.map(serializeOrder),
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
      orders: orders.map(serializeOrder),
    });
  } catch (error: any) {
    console.error('Admin orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return adminCheck.error;
    }

    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const count = clampSeedCount(body.count);

    if (count === null) {
      return NextResponse.json(
        { error: `count must be an integer between 1 and ${MAX_SEED_COUNT}` },
        { status: 400 }
      );
    }

    const seeded = await seedFakeOrders(count);

    return NextResponse.json(
      {
        success: true,
        message: `Created ${seeded.summary.total} fake orders in batch ${seeded.batchLabel}`,
        batchLabel: seeded.batchLabel,
        summary: seeded.summary,
        orders: seeded.orders.map(serializeOrder),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Admin order seeding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed fake orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return adminCheck.error;
    }

    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const status = body.status as Order['status'] | undefined;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    if (!status || !['pending', 'paid', 'failed', 'expired'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of: pending, paid, failed, expired' },
        { status: 400 }
      );
    }

    const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const existingOrder = {
      id: orderDoc.id,
      ...orderDoc.data(),
    } as Order;

    const now = Timestamp.now();
    const updateData: Partial<Order> = { status };

    if (status === 'paid') {
      updateData.paidAt = existingOrder.paidAt || now;
      updateData.sepayId = existingOrder.sepayId ?? (9000000 + Math.floor(Date.now() % 1000000));
      updateData.referenceCode = existingOrder.referenceCode || `ADMIN-${existingOrder.orderCode}`;
    } else {
      updateData.paidAt = null;
      updateData.sepayId = null;
      updateData.referenceCode = null;
    }

    if (status === 'pending') {
      updateData.expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000));
    }

    await orderRef.update(updateData);
    await syncPurchaseStatusForUser(existingOrder.userId);

    const updatedDoc = await orderRef.get();
    const updatedOrder = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Order;

    return NextResponse.json({
      success: true,
      message: `Order ${updatedOrder.orderCode} updated to ${status}`,
      order: serializeOrder(updatedOrder),
    });
  } catch (error: any) {
    console.error('Admin order update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
