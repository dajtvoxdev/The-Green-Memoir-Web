'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GameVersion {
  versionNumber: string;
  displayName: string;
  fileSize: number;
  checksum: string;
  changelog: string;
}

interface DownloadData {
  token: string;
  version: GameVersion;
  downloadUrl: string;
  expiresAt: string;
}

export default function DownloadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [showChecksum, setShowChecksum] = useState(false);
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    checkPurchaseStatus();
  }, []);

  const checkPurchaseStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const user = await response.json();
      setHasPurchased(user.hasPurchased);
      
      if (!user.hasPurchased) {
        router.push('/purchase');
        return;
      }
      
      // Generate download token
      await generateDownloadToken();
    } catch (err) {
      console.error('Check status error:', err);
      router.push('/login');
    }
  };

  const generateDownloadToken = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/download/generate-token', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate download token');
      }
      
      const data = await response.json();
      setDownloadData(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo link tải');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadData?.downloadUrl) {
      setDownloading(true);
      window.location.href = downloadData.downloadUrl;
      setTimeout(() => setDownloading(false), 5000);
    }
  };

  const handleCopyChecksum = () => {
    if (downloadData?.version.checksum) {
      navigator.clipboard.writeText(downloadData.version.checksum);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-cream">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brown-dark">Đang chuẩn bị tải game...</p>
        </div>
      </div>
    );
  }

  if (error && !downloadData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-cream">
        <div className="w-full max-w-md">
          <div className="card bg-white p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-green-dark mb-4">
              Lỗi
            </h1>
            <p className="text-brown-dark mb-6">{error}</p>
            <button
              onClick={generateDownloadToken}
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
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 bg-cream">
      <div className="max-w-4xl mx-auto">
        <div className="card bg-white p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <img
              src="/images/logo.png"
              alt="The Green Memoir"
              className="w-24 h-24"
            />
            <div className="flex-1">
              <h1 className="font-display text-3xl text-green-dark mb-2">
                The Green Memoir
              </h1>
              {downloadData && (
                <div className="flex items-center gap-4">
                  <span className="bg-green-main text-white px-3 py-1 text-sm font-bold">
                    {downloadData.version.versionNumber}
                  </span>
                  <span className="text-brown-dark">
                    {formatFileSize(downloadData.version.fileSize)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary w-full py-4 text-xl mb-6"
          >
            {downloading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang tải...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải Về cho Windows
              </span>
            )}
          </button>

          {/* Checksum */}
          {downloadData && (
            <div className="border-2 border-border rounded-lg p-4">
              <button
                onClick={() => setShowChecksum(!showChecksum)}
                className="flex items-center gap-2 text-brown-dark hover:text-green-main"
              >
                <svg 
                  className={`w-5 h-5 transition-transform ${showChecksum ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                SHA256 Checksum
              </button>
              {showChecksum && (
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 bg-cream-dark px-3 py-2 text-sm font-mono text-brown-dark break-all">
                    {downloadData.version.checksum}
                  </code>
                  <button
                    onClick={handleCopyChecksum}
                    className="text-green-main hover:text-green-dark"
                  >
                    📋
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Changelog */}
        {downloadData && (
          <div className="card bg-white p-8 mb-8">
            <h2 className="font-display text-2xl text-green-dark mb-4">
              Changelog
            </h2>
            <div className="prose prose-brown max-w-none">
              <div 
                className="text-brown-dark whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: downloadData.version.changelog
                    .replace(/\n/g, '<br/>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/^- /gm, '<li>$1</li>')
                }}
              />
            </div>
          </div>
        )}

        {/* Installation Instructions */}
        <div className="card bg-white p-8">
          <h2 className="font-display text-2xl text-green-dark mb-6">
            Hướng Dẫn Cài Đặt
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { step: 1, title: 'Giải nén', desc: 'Giải nén file ZIP đã tải về' },
              { step: 2, title: 'Cài đặt', desc: 'Chạy file .exe để cài đặt game' },
              { step: 3, title: 'Đăng nhập', desc: 'Đăng nhập bằng tài khoản đã đăng ký' },
              { step: 4, title: 'Chơi!', desc: 'Bắt đầu trải nghiệm game' },
            ].map((item) => (
              <div 
                key={item.step}
                className="flex gap-4 p-4 bg-cream-dark rounded-lg"
              >
                <div className="w-10 h-10 bg-green-dark text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-heading text-lg text-green-dark">
                    {item.title}
                  </h3>
                  <p className="text-brown-dark text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}