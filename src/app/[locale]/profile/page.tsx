'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { CURRENT_GAME_TITLE, CURRENT_GAME_VERSION_NUMBER } from '@/lib/game-release';

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
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const tProfile = useTranslations('profile');
  const tPage = useTranslations('profilePage');
  const tChange = useTranslations('changePassword');
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    void fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
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
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError(tChange('currentRequired'));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(tChange('minLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(tChange('mismatch'));
      return;
    }

    setPasswordLoading(true);

    try {
      const auth = await getFirebaseAuth();
      const authUser = auth.currentUser;

      if (!authUser?.email) {
        setPasswordError(tChange('loginAgain'));
        return;
      }

      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(authUser.email, currentPassword);

      await reauthenticateWithCredential(authUser, credential);
      await updatePassword(authUser, newPassword);

      resetPasswordForm();
      setShowChangePassword(false);
      setPasswordSuccess(tChange('success'));
    } catch (err: any) {
      const code = err?.code as string | undefined;

      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
        setPasswordError(tChange('wrongPassword'));
      } else if (code === 'auth/weak-password') {
        setPasswordError(tChange('minLength'));
      } else if (code === 'auth/requires-recent-login' || code === 'auth/user-token-expired') {
        setPasswordError(tChange('loginAgain'));
      } else {
        setPasswordError(err?.message || tChange('genericError'));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatLocalizedDate = (dateString: string | null) => {
    if (!dateString) return '-';

    return new Date(dateString).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
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
      pending: tPage('status_pending'),
      paid: tPage('status_paid'),
      failed: tPage('status_failed'),
      expired: tPage('status_expired'),
    };

    return (
      <span className={`rounded px-2 py-1 text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-cream px-4 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-green-main border-t-transparent" />
          <p className="text-brown-dark">{tPage('loading')}</p>
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
                {user.displayName || tPage('default_name')}
              </h2>
              <p className="mb-4 text-sm text-brown-dark">{user.email}</p>

              <div className="mb-4">
                {user.hasPurchased ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    {`✓ ${tProfile('purchased')}`}
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                    {tProfile('not_purchased')}
                  </span>
                )}
              </div>

              {user.createdAt && (
                <p className="text-xs text-brown-dark">
                  {tProfile('member_since')} {formatLocalizedDate(user.createdAt)}
                </p>
              )}

              {user.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  className="mt-4 inline-block text-sm font-medium text-green-main hover:text-green-dark"
                >
                  {tPage('admin_link')}
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-6 md:col-span-3">
            <div className="card bg-white p-6">
              <h3 className="mb-4 font-heading text-xl text-green-dark">
                {user.hasPurchased ? tPage('owned_game') : tPage('buy_game')}
              </h3>
              <div className="flex items-center gap-4 rounded-lg bg-cream-dark p-4">
                <img
                  src="/images/logo.png"
                  alt="The Green Memoir"
                  className="h-20 w-20"
                />
                <div className="flex-1">
                  <h4 className="font-heading text-lg text-green-dark">{CURRENT_GAME_TITLE}</h4>
                  <p className="text-sm text-brown-dark">{tPage('version', { version: CURRENT_GAME_VERSION_NUMBER })}</p>
                </div>
                <div>
                  {user.hasPurchased ? (
                    <button
                      onClick={() => router.push('/download')}
                      className="btn-primary"
                    >
                      {tPage('download_now')}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/purchase')}
                      className="btn-primary"
                    >
                      {tPage('buy_now')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card bg-white p-6">
              <h3 className="mb-4 font-heading text-xl text-green-dark">{tProfile('transactions')}</h3>
              {orders.length === 0 ? (
                <p className="py-8 text-center text-brown-dark">{tPage('no_transactions')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="px-4 py-3 text-left font-medium text-brown-dark">{tProfile('date')}</th>
                        <th className="px-4 py-3 text-left font-medium text-brown-dark">{tProfile('order_code')}</th>
                        <th className="px-4 py-3 text-left font-medium text-brown-dark">{tProfile('amount')}</th>
                        <th className="px-4 py-3 text-left font-medium text-brown-dark">{tProfile('status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-border">
                          <td className="px-4 py-3 text-brown-dark">{formatLocalizedDate(order.createdAt)}</td>
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
              <h3 className="mb-4 font-heading text-xl text-green-dark">{tProfile('settings')}</h3>
              <div className="space-y-4">
                <button className="w-full rounded-lg bg-cream-dark px-4 py-3 text-left text-brown-dark transition-colors hover:bg-cream">
                  {tProfile('change_name')}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword((value) => !value);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="w-full rounded-lg bg-cream-dark px-4 py-3 text-left text-brown-dark transition-colors hover:bg-cream"
                >
                  {tChange('open')}
                </button>

                {passwordSuccess && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {passwordSuccess}
                  </div>
                )}

                {showChangePassword && (
                  <form onSubmit={handleChangePassword} className="space-y-4 rounded-lg border border-border bg-cream-dark p-4">
                    {passwordError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {passwordError}
                      </div>
                    )}

                    <div>
                      <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-brown-dark">
                        {tChange('currentPassword')}
                      </label>
                      <input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="input"
                      />
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-brown-dark">
                        {tChange('newPassword')}
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="input"
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-brown-dark">
                        {tChange('confirmPassword')}
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="input"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button type="submit" disabled={passwordLoading} className="btn-primary">
                        {passwordLoading ? tChange('saving') : tCommon('save')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePassword(false);
                          resetPasswordForm();
                        }}
                        className="rounded-lg border border-border px-4 py-3 text-brown-dark transition-colors hover:bg-white"
                      >
                        {tCommon('cancel')}
                      </button>
                    </div>
                  </form>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg bg-red-50 px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-100"
                >
                  {tPage('logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
