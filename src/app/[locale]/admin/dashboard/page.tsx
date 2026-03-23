'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  todayVisits: number;
}

interface AdminOrder {
  id: string;
  orderCode: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  createdAt: string;
  paidAt: string | null;
}

interface AdminUser {
  uid: string;
  email: string;
  displayName: string | null;
  hasPurchased: boolean;
  disabled?: boolean;
  role: string;
  createdAt: string;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}

const ORDER_PAGE_SIZE = 12;
const USER_PAGE_SIZE = 12;

export default function AdminDashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('adminDashboard');
  const { isLoggedIn, isAdmin, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [revenueChart, setRevenueChart] = useState<RevenuePoint[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'users'>('orders');
  const statusOptions: Array<{ value: AdminOrder['status']; label: string }> = [
    { value: 'pending', label: t('status_pending') },
    { value: 'paid', label: t('status_paid') },
    { value: 'failed', label: t('status_failed') },
    { value: 'expired', label: t('status_expired') },
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

    void fetchDashboard();
  }, [authLoading, isLoggedIn, isAdmin, router]);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) return;
    void fetchOrdersPage(ordersPage);
  }, [ordersPage, isLoggedIn, isAdmin]);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) return;
    void fetchUsersPage(usersPage);
  }, [usersPage, isLoggedIn, isAdmin]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [statsRes, ordersRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/orders?limit=${ORDER_PAGE_SIZE}&offset=0`),
        fetch(`/api/admin/users?limit=${USER_PAGE_SIZE}&offset=0`),
      ]);

      const [statsData, ordersData, usersData] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
        usersRes.json(),
      ]);

      if (!statsRes.ok) {
        throw new Error(statsData.error || 'Failed to load admin stats');
      }
      if (!ordersRes.ok) {
        throw new Error(ordersData.error || 'Failed to load orders');
      }
      if (!usersRes.ok) {
        throw new Error(usersData.error || 'Failed to load users');
      }

      setStats(statsData.stats);
      setRevenueChart(statsData.revenueChart || []);
      setOrders(ordersData.orders || []);
      setOrdersTotal(ordersData.total || 0);
      setUsers(usersData.users || []);
      setUsersTotal(usersData.total || 0);
      setOrdersPage(1);
      setUsersPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersPage = async (page: number) => {
    if (loading) return;

    setOrdersLoading(true);
    try {
      const offset = (page - 1) * ORDER_PAGE_SIZE;
      const res = await fetch(`/api/admin/orders?limit=${ORDER_PAGE_SIZE}&offset=${offset}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load orders');
      }

      setOrders(data.orders || []);
      setOrdersTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchUsersPage = async (page: number) => {
    if (loading) return;

    setUsersLoading(true);
    try {
      const offset = (page - 1) * USER_PAGE_SIZE;
      const res = await fetch(`/api/admin/users?limit=${USER_PAGE_SIZE}&offset=${offset}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load users');
      }

      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const refreshSummary = async () => {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to refresh dashboard');
    }

    setStats(data.stats);
    setRevenueChart(data.revenueChart || []);
  };

  const handleRefresh = async () => {
    await fetchDashboard();
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')}₫`;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: AdminOrder['status']) => {
    const styles: Record<AdminOrder['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<AdminOrder['status'], string> = {
      pending: t('status_pending'),
      paid: t('status_paid'),
      failed: t('status_failed'),
      expired: t('status_expired'),
    };

    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleOrderStatusChange = async (orderId: string, status: AdminOrder['status']) => {
    const previousOrders = orders;
    setSavingOrderId(orderId);
    setError('');
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));

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
        throw new Error(data.error || t('updateOrderError'));
      }

      await Promise.all([refreshSummary(), fetchOrdersPage(ordersPage)]);
    } catch (err) {
      setOrders(previousOrders);
      setError(err instanceof Error ? err.message : t('updateOrderError'));
    } finally {
      setSavingOrderId(null);
    }
  };

  const handleUserDisabledChange = async (uid: string, disabled: boolean) => {
    const previousUsers = users;
    setSavingUserId(uid);
    setError('');
    setUsers((current) => current.map((user) => (user.uid === uid ? { ...user, disabled } : user)));

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, disabled }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('updateUserError'));
      }

      await Promise.all([refreshSummary(), fetchUsersPage(usersPage)]);
    } catch (err) {
      setUsers(previousUsers);
      setError(err instanceof Error ? err.message : t('updateUserError'));
    } finally {
      setSavingUserId(null);
    }
  };

  const buildPageNumbers = (totalItems: number, pageSize: number, currentPage: number) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    const pages: number[] = [];

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    return { pages, totalPages };
  };

  const chartData: ChartData<'line'> = {
    labels: revenueChart.map((point) =>
      new Date(point.date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
      }),
    ),
    datasets: [
      {
        label: t('revenueSeries'),
        data: revenueChart.map((point) => point.revenue),
        borderColor: '#2f6b4f',
        backgroundColor: 'rgba(47, 107, 79, 0.14)',
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#f4efe2',
        pointBorderColor: '#2f6b4f',
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        backgroundColor: '#1f3d2d',
        callbacks: {
          label: (context) => ` ${formatCurrency(Number(context.parsed.y || 0))}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b5b45',
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 91, 69, 0.12)',
        },
        ticks: {
          color: '#6b5b45',
          callback: (value) => {
            const numericValue = Number(value);
            if (numericValue >= 1000000) return `${(numericValue / 1000000).toFixed(1)}M`;
            if (numericValue >= 1000) return `${Math.round(numericValue / 1000)}k`;
            return numericValue.toString();
          },
        },
      },
    },
  };

  const ordersPagination = buildPageNumbers(ordersTotal, ORDER_PAGE_SIZE, ordersPage);
  const usersPagination = buildPageNumbers(usersTotal, USER_PAGE_SIZE, usersPage);

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-green-main border-t-transparent" />
          <p className="text-brown-dark">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-brown-dark/70">{t('backOffice')}</p>
            <h1 className="font-heading text-3xl text-green-dark">{t('title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleRefresh()}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm text-brown-dark transition hover:border-green-main hover:text-green-main"
            >
              {t('refresh')}
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm text-brown-dark transition hover:border-green-main hover:text-green-main"
            >
              {t('backToProfile')}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="card bg-white p-5">
              <p className="mb-2 text-sm text-brown-dark">{t('totalUsers')}</p>
              <p className="font-heading text-3xl text-green-dark">{stats.totalUsers}</p>
            </div>
            <div className="card bg-white p-5">
              <p className="mb-2 text-sm text-brown-dark">{t('totalOrders')}</p>
              <p className="font-heading text-3xl text-green-dark">{stats.totalOrders}</p>
            </div>
            <div className="card bg-white p-5">
              <p className="mb-2 text-sm text-brown-dark">{t('totalRevenue')}</p>
              <p className="font-heading text-3xl text-green-dark">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="card bg-white p-5">
              <p className="mb-2 text-sm text-brown-dark">{t('todayVisits')}</p>
              <p className="font-heading text-3xl text-green-dark">{stats.todayVisits}</p>
            </div>
          </div>
        )}

        <section className="card overflow-hidden bg-white">
          <div className="border-b border-border px-6 py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-heading text-xl text-green-dark">{t('revenue30Days')}</h2>
                <p className="mt-1 text-sm text-brown-dark">
                  {t('revenueDescription')}
                </p>
              </div>
              <div className="rounded-2xl bg-cream px-4 py-3 text-sm text-brown-dark">
                <span className="block text-xs uppercase tracking-[0.18em] text-brown-dark/70">{t('last30Days')}</span>
                <span className="font-heading text-lg text-green-dark">
                  {formatCurrency(revenueChart.reduce((sum, point) => sum + point.revenue, 0))}
                </span>
              </div>
            </div>
          </div>
          <div className="h-[340px] p-6">
            <Line data={chartData} options={chartOptions} />
          </div>
        </section>

        <section className="card overflow-hidden bg-white">
          <div className="border-b border-border px-6 pt-5">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`rounded-t-2xl px-5 py-3 text-sm font-medium transition ${
                  activeTab === 'orders'
                    ? 'bg-green-dark text-white'
                    : 'bg-cream text-brown-dark hover:bg-cream-dark'
                }`}
              >
                {t('ordersTab')}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`rounded-t-2xl px-5 py-3 text-sm font-medium transition ${
                  activeTab === 'users'
                    ? 'bg-green-dark text-white'
                    : 'bg-cream text-brown-dark hover:bg-cream-dark'
                }`}
              >
                {t('usersTab')}
              </button>
            </div>
          </div>

          {activeTab === 'orders' ? (
            <section>
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl text-green-dark">{t('allOrders')}</h2>
                  <p className="mt-1 text-sm text-brown-dark">
                    {t('allOrdersDescription')}
                  </p>
                </div>
                <span className="rounded-full bg-cream px-3 py-1 text-sm text-brown-dark">
                  {t('ordersCount', { count: ordersTotal })}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-cream/70 text-xs uppercase tracking-[0.16em] text-brown-dark/70">
                  <tr>
                    <th className="px-6 py-4">{t('orderCode')}</th>
                    <th className="px-6 py-4">{t('customer')}</th>
                    <th className="px-6 py-4">{t('amount')}</th>
                    <th className="px-6 py-4">{t('status')}</th>
                    <th className="px-6 py-4">{t('createdAt')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-brown-dark">
                        {t('loadingOrders')}
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-brown-dark">
                        {t('noOrders')}
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="align-top">
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm text-brown-dark">{order.orderCode}</p>
                          <p className="mt-1 text-xs text-brown-dark/70">ID: {order.id.slice(0, 8)}...</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-brown-dark">{order.userEmail}</p>
                          <p className="mt-1 text-xs text-brown-dark/70">{order.userId}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-green-dark">
                          {formatCurrency(order.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {getStatusBadge(order.status)}
                            <select
                              className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-brown-dark disabled:opacity-60"
                              value={order.status}
                              disabled={savingOrderId === order.id}
                              onChange={(event) =>
                                void handleOrderStatusChange(order.id, event.target.value as AdminOrder['status'])
                              }
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {savingOrderId === order.id && (
                              <p className="text-xs text-brown-dark/70">{t('savingChanges')}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-brown-dark">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-brown-dark">
                {t('pageLabel', { current: ordersPage, total: ordersPagination.totalPages })}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setOrdersPage((page) => Math.max(1, page - 1))}
                  disabled={ordersPage === 1 || ordersLoading}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-brown-dark transition hover:border-green-main hover:text-green-main disabled:opacity-50"
                >
                  {t('previous')}
                </button>
                {ordersPagination.pages.map((page) => (
                  <button
                    key={page}
                    onClick={() => setOrdersPage(page)}
                    className={`rounded-full px-3 py-1.5 text-sm transition ${
                      page === ordersPage
                        ? 'bg-green-dark text-white'
                        : 'border border-border text-brown-dark hover:border-green-main hover:text-green-main'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setOrdersPage((page) => Math.min(ordersPagination.totalPages, page + 1))}
                  disabled={ordersPage === ordersPagination.totalPages || ordersLoading}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-brown-dark transition hover:border-green-main hover:text-green-main disabled:opacity-50"
                >
                  {t('next')}
                </button>
              </div>
            </div>
            </section>
          ) : (
            <section>
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl text-green-dark">{t('allUsers')}</h2>
                  <p className="mt-1 text-sm text-brown-dark">
                    {t('allUsersDescription')}
                  </p>
                </div>
                <span className="rounded-full bg-cream px-3 py-1 text-sm text-brown-dark">
                  {t('usersCount', { count: usersTotal })}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-cream/70 text-xs uppercase tracking-[0.16em] text-brown-dark/70">
                  <tr>
                    <th className="px-6 py-4">{t('user')}</th>
                    <th className="px-6 py-4">{t('role')}</th>
                    <th className="px-6 py-4">{t('accountStatus')}</th>
                    <th className="px-6 py-4">{t('createdAt')}</th>
                    <th className="px-6 py-4">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-brown-dark">
                        {t('loadingUsers')}
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-brown-dark">
                        {t('noUsers')}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.uid} className="align-top">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-dark text-sm font-semibold text-white">
                              {(user.displayName || user.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-brown-dark">
                                {user.displayName || t('unnamed')}
                              </p>
                              <p className="truncate text-sm text-brown-dark/80">{user.email}</p>
                              <p className="mt-1 truncate text-xs text-brown-dark/60">{user.uid}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {user.role === 'admin' && (
                              <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800">
                                Admin
                              </span>
                            )}
                            {user.hasPurchased && (
                              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                                {t('purchased')}
                              </span>
                            )}
                            {user.role !== 'admin' && !user.hasPurchased && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                User
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.disabled ? (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                              {t('locked')}
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              {t('active')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-brown-dark">{formatDate(user.createdAt)}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => void handleUserDisabledChange(user.uid, !(user.disabled || false))}
                            disabled={savingUserId === user.uid || user.role === 'admin'}
                            className={`rounded-full px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              user.disabled
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {savingUserId === user.uid
                              ? t('saving')
                              : user.disabled
                                ? t('reactivate')
                                : t('deactivate')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-brown-dark">
                {t('pageLabel', { current: usersPage, total: usersPagination.totalPages })}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setUsersPage((page) => Math.max(1, page - 1))}
                  disabled={usersPage === 1 || usersLoading}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-brown-dark transition hover:border-green-main hover:text-green-main disabled:opacity-50"
                >
                  {t('previous')}
                </button>
                {usersPagination.pages.map((page) => (
                  <button
                    key={page}
                    onClick={() => setUsersPage(page)}
                    className={`rounded-full px-3 py-1.5 text-sm transition ${
                      page === usersPage
                        ? 'bg-green-dark text-white'
                        : 'border border-border text-brown-dark hover:border-green-main hover:text-green-main'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setUsersPage((page) => Math.min(usersPagination.totalPages, page + 1))}
                  disabled={usersPage === usersPagination.totalPages || usersLoading}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-brown-dark transition hover:border-green-main hover:text-green-main disabled:opacity-50"
                >
                  {t('next')}
                </button>
              </div>
            </div>
            </section>
          )}
        </section>
      </div>
    </div>
  );
}
