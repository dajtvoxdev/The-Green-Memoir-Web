'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserProfile();
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
      
      // Fetch orders
      fetchOrders(userData.uid);
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
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
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

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('vi-VN')}₫`;
  };

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
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-cream">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brown-dark">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 bg-cream">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="card bg-white p-6 text-center">
              <div className="w-24 h-24 bg-green-dark rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
              <h2 className="font-heading text-xl text-green-dark mb-1">
                {user.displayName || 'User'}
              </h2>
              <p className="text-brown-dark text-sm mb-4">
                {user.email}
              </p>
              <div className="mb-4">
                {user.hasPurchased ? (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    ✓ Đã Mua
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    Chưa Mua
                  </span>
                )}
              </div>
              {user.createdAt && (
                <p className="text-brown-dark text-xs">
                  Thành viên từ {formatDate(user.createdAt)}
                </p>
              )}
              {user.role === 'admin' && (
                <a
                  href="/admin/dashboard"
                  className="inline-block mt-4 text-green-main hover:text-green-dark text-sm font-medium"
                >
                  Quản Trị →
                </a>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            {/* Game Card */}
            <div className="card bg-white p-6">
              <h3 className="font-heading text-xl text-green-dark mb-4">
                Game Đã Mua
              </h3>
              <div className="flex items-center gap-4 p-4 bg-cream-dark rounded-lg">
                <img
                  src="/images/logo.png"
                  alt="The Green Memoir"
                  className="w-20 h-20"
                />
                <div className="flex-1">
                  <h4 className="font-heading text-lg text-green-dark">
                    The Green Memoir - Early Access
                  </h4>
                  <p className="text-brown-dark text-sm">
                    Phiên bản: v0.1.0-alpha
                  </p>
                </div>
                <div>
                  {user.hasPurchased ? (
                    <button
                      onClick={() => router.push('/download')}
                      className="btn-primary"
                    >
                      Tải Về
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/purchase')}
                      className="btn-primary"
                    >
                      Mua Ngay
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="card bg-white p-6">
              <h3 className="font-heading text-xl text-green-dark mb-4">
                Lịch Sử Giao Dịch
              </h3>
              {orders.length === 0 ? (
                <p className="text-brown-dark text-center py-8">
                  Chưa có giao dịch nào
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="text-left py-3 px-4 text-brown-dark font-medium">
                          Ngày
                        </th>
                        <th className="text-left py-3 px-4 text-brown-dark font-medium">
                          Mã Đơn
                        </th>
                        <th className="text-left py-3 px-4 text-brown-dark font-medium">
                          Số Tiền
                        </th>
                        <th className="text-left py-3 px-4 text-brown-dark font-medium">
                          Trạng Thái
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-border">
                          <td className="py-3 px-4 text-brown-dark">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-brown-dark font-mono text-sm">
                            {order.orderCode}
                          </td>
                          <td className="py-3 px-4 text-brown-dark">
                            {formatCurrency(order.amount)}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(order.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="card bg-white p-6">
              <h3 className="font-heading text-xl text-green-dark mb-4">
                Cài Đặt
              </h3>
              <div className="space-y-4">
                <button className="w-full text-left px-4 py-3 bg-cream-dark rounded-lg hover:bg-cream transition-colors text-brown-dark">
                  Đổi Tên Hiển Thị
                </button>
                <button className="w-full text-left px-4 py-3 bg-cream-dark rounded-lg hover:bg-cream transition-colors text-brown-dark">
                  Đổi Mật Khẩu
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-red-600"
                >
                  Đăng Xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}