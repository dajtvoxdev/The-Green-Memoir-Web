'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getFirebaseAuth } from '@/lib/firebase-client';

export default function ForgotPasswordPage() {
  const tAuth = useTranslations('auth.forgot_password');
  const tPage = useTranslations('forgotPasswordPage');
  const tAuthPage = useTranslations('authPage');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const auth = await getFirebaseAuth();
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      setSuccess(tAuth('success'));
    } catch (err: any) {
      setError(err.message || tPage('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card bg-white p-8">
          <div className="mb-6 text-center">
            <img src="/images/logo.png" alt="The Green Memoir" className="mx-auto mb-4 h-20 w-20" />
            <h1 className="font-display text-2xl text-green-dark">{tAuth('title')}</h1>
            <p className="mt-2 text-sm text-brown-dark">{tPage('description')}</p>
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-brown-dark">
                {tAuth('email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder={tAuthPage('emailPlaceholder')}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? tPage('sending') : tAuth('submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm font-medium text-green-main hover:text-green-dark">
              {tPage('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
