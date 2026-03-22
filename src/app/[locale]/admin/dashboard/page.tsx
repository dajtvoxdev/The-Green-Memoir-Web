'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  todayVisits: number;
}

interface RecentOrder {
  id: string;
  orderCode: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  createdAt: string;
  paidAt: string | null;
}

interface RecentUser {
  uid: string;
  email: string;
  displayName: string | null;
  hasPurchased: boolean;
  role: string;
  createdAt: string;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isLoggedIn, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [revenueChart, setRevenueChart] = useState<RevenuePoint[]>([]);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  const statusOptions: Array<{ value: RecentOrder['status']; label: string }> = [
    { value: 'pending', label: 'Chờ TT' },
    { value: 'paid', label: 'Đã TT' },
    { value: 'failed', label: 'Thất bại' },
    { value: 'expired', label: 'Hết hạn' },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/profile');
      return;
    }
    fetchStats();
  }, [authLoading, isLoggedIn, isAdmin, router]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to load stats');
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setRecentOrders(data.recentOrders || []);
      setRecentUsers(data.recentUsers || []);
      setRevenueChart(data.revenueChart || []);
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `${amount.toLocaleString('vi-VN')}₫`;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      pending: 'Chờ TT',
      paid: 'Đã TT',
      failed: 'Thất bại',
      expired: 'Hết hạn',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const handleOrderStatusChange = async (orderId: string, status: RecentOrder['status']) => {
    const previousOrders = recentOrders;
    setSavingOrderId(orderId);
    setError('');
    setRecentOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order)),
    );

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể cập nhật trạng thái đơn hàng');
      }

      await fetchStats();
    } catch (err) {
      setRecentOrders(previousOrders);
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setSavingOrderId(null);
    }
  };

  // Simple bar chart using CSS
  const maxRevenue = Math.max(...revenueChart.map(r => r.revenue), 1);

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brown-dark">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream">
        <div className="card bg-white p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => { setError(''); setLoading(true); fetchStats(); }} className="btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 bg-cream">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-2xl text-green-dark">Admin Dashboard</h1>
          <button
            onClick={() => router.push('/profile')}
            className="text-brown-dark hover:text-green-main text-sm"
          >
            ← Hồ sơ
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card bg-white p-5">
              <p className="text-brown-dark text-sm mb-1">Tổng người dùng</p>
              <p className="font-heading text-2xl text-green-dark">{stats.totalUsers}</p>
            </div>
            <div className="card bg-white p-5">
              <p className="text-brown-dark text-sm mb-1">Tổng đơn hàng</p>
              <p className="font-heading text-2xl text-green-dark">{stats.totalOrders}</p>
            </div>
            <div className="card bg-white p-5">
              <p className="text-brown-dark text-sm mb-1">Doanh thu</p>
              <p className="font-heading text-2xl text-green-dark">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="card bg-white p-5">
              <p className="text-brown-dark text-sm mb-1">Lượt truy cập hôm nay</p>
              <p className="font-heading text-2xl text-green-dark">{stats.todayVisits}</p>
            </div>
          </div>
        )}

        {/* Revenue Chart */}
        {revenueChart.length > 0 && (
          <div className="card bg-white p-6 mb-8">
            <h2 className="font-heading text-lg text-green-dark mb-4">Doanh thu 30 ngày</h2>
            <div className="flex items-end gap-px h-40 overflow-x-auto">
              {revenueChart.map((point) => (
                <div
                  key={point.date}
                  className="flex-1 min-w-[8px] group relative"
                  title={`${point.date}: ${formatCurrency(point.revenue)}`}
                >
                  <div
                    className="bg-green-main hover:bg-green-dark transition-colors rounded-t-sm w-full"
                    style={{
                      height: `${Math.max((point.revenue / maxRevenue) * 100, point.revenue > 0 ? 4 : 0)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-brown-dark mt-2">
              <span>{revenueChart[0]?.date.slice(5)}</span>
              <span>{revenueChart[revenueChart.length - 1]?.date.slice(5)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="card bg-white p-6">
            <h2 className="font-heading text-lg text-green-dark mb-4">Đơn hàng gần đây</h2>
            {recentOrders.length === 0 ? (
              <p className="text-brown-dark text-center py-6">Chưa có đơn hàng</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-3 p-3 bg-cream-dark rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono text-brown-dark truncate">{order.orderCode}</p>
                      <p className="text-xs text-brown-dark truncate">{order.userEmail}</p>
                      <p className="text-xs text-brown-dark mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-sm font-medium text-green-dark">{formatCurrency(order.amount)}</p>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex flex-col gap-2 w-32 flex-shrink-0">
                      <label className="text-xs text-brown-dark text-left" htmlFor={`order-status-${order.id}`}>
                        Trạng thái
                      </label>
                      <select
                        id={`order-status-${order.id}`}
                        className="bg-white border border-border rounded px-2 py-1 text-sm text-brown-dark disabled:opacity-60"
                        value={order.status}
                        disabled={savingOrderId === order.id}
                        onChange={(event) => handleOrderStatusChange(order.id, event.target.value as RecentOrder['status'])}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {savingOrderId === order.id && (
                        <p className="text-[11px] text-brown-dark text-left">Đang lưu...</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="card bg-white p-6">
            <h2 className="font-heading text-lg text-green-dark mb-4">Người dùng mới</h2>
            {recentUsers.length === 0 ? (
              <p className="text-brown-dark text-center py-6">Chưa có người dùng</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u) => (
                  <div key={u.uid} className="flex items-center justify-between p-3 bg-cream-dark rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-green-dark rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(u.displayName || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-brown-dark truncate">{u.displayName || u.email}</p>
                        <p className="text-xs text-brown-dark">{formatDate(u.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {u.hasPurchased && (
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Đã mua</span>
                      )}
                      {u.role === 'admin' && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">Admin</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
