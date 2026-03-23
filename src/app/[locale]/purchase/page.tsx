'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

interface OrderData {
  orderId: string;
  orderCode: string;
  amount: number;
  qrUrl: string;
  expiresAt: string;
  bankInfo: {
    bank: string;
    accountNumber: string;
    accountName: string;
  };
}

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

export default function PurchasePage() {
  const router = useRouter();
  const tPayment = useTranslations('payment');
  const tPage = useTranslations('paymentPage');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const createOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/payment/create-order', { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create order');
      }

      const data = await response.json();
      setOrder(data);
      setStatus('pending');

      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      const diff = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      setTimeLeft(Math.max(0, diff));
    } catch (err: any) {
      setError(err.message || tPage('createOrderError'));
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = useCallback(async () => {
    if (!order?.orderId) return;

    try {
      const response = await fetch(`/api/payment/check-status?orderId=${order.orderId}`);
      const data = await response.json();

      if (data.status === 'paid' || data.hasPurchased) {
        setStatus('paid');
      } else if (data.status === 'expired') {
        setStatus('expired');
        setTimeLeft(0);
      }
    } catch (err) {
      console.error('Status check failed:', err);
    }
  }, [order?.orderId]);

  useEffect(() => {
    if (status !== 'pending' || !order) return;
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [status, order, checkStatus]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleCopyOrderCode = () => {
    if (!order?.orderCode) return;
    navigator.clipboard.writeText(order.orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'paid') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card bg-white p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-4 font-display text-2xl text-green-dark">{tPage('successTitle')}</h1>
            <p className="mb-6 text-brown-dark">{tPage('successDescription')}</p>
            <button onClick={() => router.push('/download')} className="btn-primary w-full">
              {tPayment('download_now')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card bg-white p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mb-4 font-display text-2xl text-green-dark">{tPage('expiredTitle')}</h1>
            <p className="mb-6 text-brown-dark">{tPage('expiredDescription')}</p>
            <button onClick={createOrder} className="btn-primary w-full">
              {tPage('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-2xl">
        {!order ? (
          <div className="card bg-white p-8">
            <div className="mb-6 text-center">
              <img src="/images/logo.png" alt="The Green Memoir" className="mx-auto mb-4 h-20 w-20" />
              <h1 className="mb-2 font-display text-2xl text-green-dark">{tPage('orderSummary')}</h1>
            </div>

            <div className="mb-6 rounded-lg bg-cream-dark p-6">
              <div className="mb-4 flex items-center gap-4">
                <img src="/images/logo.png" alt="Game" className="h-16 w-16" />
                <div>
                  <h3 className="font-heading text-lg text-green-dark">{tPayment('game_name')}</h3>
                  <p className="text-2xl font-bold text-gold">{tPayment('price')}</p>
                </div>
              </div>
              <ul className="space-y-2 text-brown-dark">
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-main" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  {tPayment('features.full_access')}
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-main" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  {tPayment('features.free_updates')}
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-main" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  {tPayment('features.cloud_save')}
                </li>
              </ul>
            </div>

            {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <button onClick={createOrder} disabled={loading} className="btn-primary mb-4 w-full">
              {loading ? tPage('processing') : tPage('payNowPrice')}
            </button>

            <button onClick={() => router.back()} className="w-full text-sm text-brown-dark hover:text-green-main">
              {tPage('goBack')}
            </button>
          </div>
        ) : (
          <div className="card bg-white p-8">
            <div className="mb-6 text-center">
              <h1 className="mb-2 font-display text-2xl text-green-dark">{tPage('qrTitle')}</h1>
              <p className="text-brown-dark">{tPage('qrDescription')}</p>
            </div>

            <div className="mb-6 flex justify-center">
              <div className="border-4 border-brown-dark bg-white p-4">
                <img
                  src={order.qrUrl}
                  alt="QR Code"
                  className="h-64 w-64"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"%3E%3Crect fill="%23fff" width="256" height="256"/%3E%3Ctext fill="%232D5A27" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EQR Code%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </div>

            <div className="mb-6 space-y-3 rounded-lg bg-cream-dark p-4">
              <div className="flex justify-between"><span className="text-brown-dark">{tPage('bank')}</span><span className="font-medium text-green-dark">{order.bankInfo.bank}</span></div>
              <div className="flex justify-between"><span className="text-brown-dark">{tPage('accountNumber')}</span><span className="font-medium text-green-dark">{order.bankInfo.accountNumber}</span></div>
              {order.bankInfo.accountName && (
                <div className="flex justify-between"><span className="text-brown-dark">{tPage('accountHolder')}</span><span className="font-medium text-green-dark">{order.bankInfo.accountName}</span></div>
              )}
              <div className="flex justify-between"><span className="text-brown-dark">{tPage('amount')}</span><span className="font-medium text-gold">{order.amount.toLocaleString('vi-VN')}₫</span></div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-brown-dark">{tPage('transferContent')}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded border-2 border-green-main bg-white px-3 py-1 font-mono font-bold text-green-dark">{order.orderCode}</span>
                    <button onClick={handleCopyOrderCode} className="text-green-main hover:text-green-dark">{copied ? '✓' : '📋'}</button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`mb-6 text-center ${timeLeft < 120 ? 'text-red-600' : 'text-brown-dark'}`}>
              <p className="text-sm">{tPage('remaining')}</p>
              <p className="text-3xl font-mono font-bold">{formatTime(timeLeft)}</p>
            </div>

            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-2 text-brown-dark">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-main border-t-transparent" />
                <span>{tPage('waiting')}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={checkStatus} className="btn-primary flex-1">{tPage('confirmPaid')}</button>
              <button onClick={() => { setOrder(null); setStatus('pending'); }} className="btn-secondary px-6">{tPage('cancel')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
