import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { adminDb, COLLECTIONS } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

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

    // Get total users
    const usersSnapshot = await adminDb.collection(COLLECTIONS.WEB_USERS).count().get();
    const totalUsers = usersSnapshot.data().count;

    // Get total orders and revenue
    const ordersSnapshot = await adminDb.collection(COLLECTIONS.ORDERS).get();
    let totalOrders = 0;
    let totalRevenue = 0;
    const paidOrders: Array<{ amount: number; paidAt: string | null }> = [];
    
    ordersSnapshot.forEach(doc => {
      totalOrders++;
      const data = doc.data();
      if (data.status === 'paid') {
        totalRevenue += data.amount || 0;
        paidOrders.push({ 
          amount: data.amount || 0, 
          paidAt: data.paidAt?.toDate().toISOString() || null 
        });
      }
    });

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await adminDb.collection(COLLECTIONS.SITE_STATS).doc(today).get();
    const todayVisits = todayStats.exists ? todayStats.data()?.pageViews || 0 : 0;

    // Get recent orders (last 10)
    const recentOrdersSnapshot = await adminDb.collection(COLLECTIONS.ORDERS)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const recentOrders = recentOrdersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      paidAt: doc.data().paidAt?.toDate().toISOString(),
    }));

    // Get recent users (last 10)
    const recentUsersSnapshot = await adminDb.collection(COLLECTIONS.WEB_USERS)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentUsers = recentUsersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    // Get revenue for last 30 days
    const revenueByDate: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      revenueByDate[dateStr] = 0;
    }

    paidOrders.forEach(order => {
      if (order.paidAt) {
        const dateStr = order.paidAt.split('T')[0];
        if (revenueByDate[dateStr] !== undefined) {
          revenueByDate[dateStr] += order.amount;
        }
      }
    });

    const revenueChart = Object.entries(revenueByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    return NextResponse.json({
      stats: {
        totalUsers,
        totalOrders,
        totalRevenue,
        todayVisits,
      },
      recentOrders,
      recentUsers,
      revenueChart,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}