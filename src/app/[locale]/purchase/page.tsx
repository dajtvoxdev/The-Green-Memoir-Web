'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

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
  const [order, setOrder] = useState<OrderData | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutes in seconds
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
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create order');
      }
      
      const data = await response.json();
      setOrder(data);
      setStatus('pending');
      
      // Calculate time left from server
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      const diff = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      setTimeLeft(Math.max(0, diff));
    } catch (err: any) {
      setError(err.message || 'Không thể tạo đơn hàng');
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

  // Poll status every 5 seconds
  useEffect(() => {
    if (status !== 'pending' || !order) return;
    
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [status, order, checkStatus]);

  // Countdown timer
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
    if (order?.orderCode) {
      navigator.clipboard.writeText(order.orderCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmPayment = () => {
    checkStatus();
  };

  if (status === 'paid') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-cream">
        <div className="w-full max-w-md">
          <div className="card bg-white p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-green-dark mb-4">
              Thanh toán thành công!
            </h1>
            <p className="text-brown-dark mb-6">
              Cảm ơn bạn đã mua game. Bạn có thể tải game ngay bây giờ.
            </p>
            <button
              onClick={() => router.push('/download')}
              className="btn-primary w-full"
            >
              Tải Game Ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-cream">
        <div className="w-full max-w-md">
          <div className="card bg-white p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-green-dark mb-4">
              Đơn hàng đã hết hạn
            </h1>
            <p className="text-brown-dark mb-6">
              Thời gian thanh toán đã hết. Vui lòng thử lại.
            </p>
            <button
              onClick={createOrder}
              className="btn-primary w-full"
            >
              Thử Lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-cream">
      <div className="w-full max-w-2xl">
        {!order ? (
          // Order confirmation step
          <div className="card bg-white p-8">
            <div className="text-center mb-6">
              <img
                src="/images/logo.png"
                alt="The Green Memoir"
                className="w-20 h-20 mx-auto mb-4"
              />
              <h1 className="font-display text-2xl text-green-dark mb-2">
                Xác Nhận Đơn Hàng
              </h1>
            </div>

            <div className="bg-cream-dark rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="/images/logo.png"
                  alt="Game"
                  className="w-16 h-16"
                />
                <div>
                  <h3 className="font-heading text-lg text-green-dark">
                    The Green Memoir - Early Access
                  </h3>
                  <p className="text-2xl font-bold text-gold">49,000₫</p>
                </div>
              </div>
              <ul className="space-y-2 text-brown-dark">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-main" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Truy cập đầy đủ game
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-main" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Cập nhật miễn phí
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-main" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Lưu đám mây
                </li>
              </ul>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            <button
              onClick={createOrder}
              disabled={loading}
              className="btn-primary w-full mb-4"
            >
              {loading ? 'Đang xử lý...' : 'Thanh Toán 49,000₫'}
            </button>

            <button
              onClick={() => router.back()}
              className="w-full text-brown-dark hover:text-green-main text-sm"
            >
              ← Quay lại
            </button>
          </div>
        ) : (
          // QR Payment step
          <div className="card bg-white p-8">
            <div className="text-center mb-6">
              <h1 className="font-display text-2xl text-green-dark mb-2">
                Quét QR Để Thanh Toán
              </h1>
              <p className="text-brown-dark">
                Chuyển khoản ngân hàng với nội dung chính xác
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 border-4 border-brown-dark">
                <img
                  src={order.qrUrl}
                  alt="QR Code"
                  className="w-64 h-64"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"%3E%3Crect fill="%23fff" width="256" height="256"/%3E%3Ctext fill="%232D5A27" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EQR Code%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </div>

            {/* Bank info */}
            <div className="bg-cream-dark rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-brown-dark">Ngân Hàng:</span>
                <span className="font-medium text-green-dark">{order.bankInfo.bank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brown-dark">Số Tài Khoản:</span>
                <span className="font-medium text-green-dark">{order.bankInfo.accountNumber}</span>
              </div>
              {order.bankInfo.accountName && (
                <div className="flex justify-between">
                  <span className="text-brown-dark">Chủ Tài Khoản:</span>
                  <span className="font-medium text-green-dark">{order.bankInfo.accountName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-brown-dark">Số Tiền:</span>
                <span className="font-medium text-gold">{order.amount.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-brown-dark">Nội Dung CK:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-green-dark bg-white px-3 py-1 rounded border-2 border-green-main">
                      {order.orderCode}
                    </span>
                    <button
                      onClick={handleCopyOrderCode}
                      className="text-sm text-green-main hover:text-green-dark"
                    >
                      {copied ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className={`text-center mb-6 ${timeLeft < 120 ? 'text-red-600' : 'text-brown-dark'}`}>
              <p className="text-sm">Còn Lại:</p>
              <p className="text-3xl font-mono font-bold">{formatTime(timeLeft)}</p>
            </div>

            {/* Status */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 text-brown-dark">
                <div className="w-4 h-4 border-2 border-green-main border-t-transparent rounded-full animate-spin" />
                <span>Đang chờ thanh toán...</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleConfirmPayment}
                className="btn-primary flex-1"
              >
                Tôi Đã Thanh Toán
              </button>
              <button
                onClick={() => {
                  setOrder(null);
                  setStatus('pending');
                }}
                className="btn-secondary px-6"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}