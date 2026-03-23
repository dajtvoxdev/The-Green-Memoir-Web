'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  hasPurchased: boolean;
  role: string;
  createdAt: string | null;
}

interface Order {
  id: string;
  orderCode: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    void fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const userData = await response.json();
      setUser(userData);
      void fetchOrders(userData.uid);
    } catch (err) {
      console.error('Fetch profile error:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (uid: string) => {
    try {
      const response = await fetch(`/api/admin/orders?userId=${uid}`);
      if (!response.ok) return;

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';

    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')}₫`;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<string, string> = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thất bại',
      expired: 'Hết hạn',
    };

    return (
      <span className={`rounded px-2 py-1 text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream px-4 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-green-main border-t-transparent" />
          <p className="text-brown-dark">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="card bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-dark text-3xl font-bold text-white">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
              <h2 className="mb-1 font-heading text-xl text-green-dark">
                {user.displayName || 'User'}
              </h2>
              <p className="mb-4 text-sm text-brown-dark">{user.email}</p>

              <div className="mb-4">
                {user.hasPurchased ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    ✓ Đã mua
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                    Chưa mua
                  </span>
                )}
              </div>

              {user.createdAt && (
                <p className="text-xs text-brown-dark">Thành viên từ {formatDate(user.createdAt)}</p>
              )}

              {user.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  className="mt-4 inline-block text-sm font-medium text-green-main hover:text-green-dark"
                >
                  Quản Trị →
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-6 md:col-span-3">
            <div className="card bg-white p-6">
              <h3 className="mb-4 font-heading text-xl text-green-dark">
                {user.hasPurchased ? 'Game đã mua' : 'Mua game'}
              </h3>
              <div className="flex items-center gap-4 rounded-lg bg-cream-dark p-4">
                <img
                  src="/images/logo.png"
                  alt="The Green Memoir"
                  className="h-20 w-20"
                />
                <div className="flex-1">
                  <h4 className="font-heading text-lg text-green-dark">The Green Memoir - Early Access</h4>
                  <p className="text-sm text-brown-dark">Phiên bản: v0.1.0-alpha</p>
                </div>
                <div>
                  {user.hasPurchased ? (
                    <button
                      onClick={() => router.push('/download')}
                      className="btn-primary"
                    >
                      Tải về
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/purchase')}
                      className="btn-primary"
                    >
                      Mua ngay
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card bg-white p-6">
              <h3 className="mb-4 font-heading text-xl text-green-dark">Lịch sử giao dịch</h3>
              {orders.length === 0 ? (
                <p className="py-8 text-center text-brown-dark">Chưa có giao dịch nào</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="px-4 py-3 text-left font-medium text-brown-dark">Ngày</th>
                        <th className="px-4 py-3 text-left font-medium text-brown-dark">Mã đơn</th>
                        <th className="px-4 py-3 text-left font-medium text-brown-dark">Số tiền</th>
                        <th className="px-4 py-3 text-left font-medium text-brown-dark">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-border">
                          <td className="px-4 py-3 text-brown-dark">{formatDate(order.createdAt)}</td>
                          <td className="px-4 py-3 font-mono text-sm text-brown-dark">{order.orderCode}</td>
                          <td className="px-4 py-3 text-brown-dark">{formatCurrency(order.amount)}</td>
                          <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card bg-white p-6">
              <h3 className="mb-4 font-heading text-xl text-green-dark">Cài đặt</h3>
              <div className="space-y-4">
                <button className="w-full rounded-lg bg-cream-dark px-4 py-3 text-left text-brown-dark transition-colors hover:bg-cream">
                  Đổi tên hiển thị
                </button>
                <button className="w-full rounded-lg bg-cream-dark px-4 py-3 text-left text-brown-dark transition-colors hover:bg-cream">
                  Đổi mật khẩu
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg bg-red-50 px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-100"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
