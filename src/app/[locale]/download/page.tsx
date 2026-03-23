'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

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
  const tDownload = useTranslations('download');
  const tPage = useTranslations('downloadPage');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [showChecksum, setShowChecksum] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  useEffect(() => {
    void checkPurchaseStatus();
  }, []);

  const checkPurchaseStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const user = await response.json();
      if (!user.hasPurchased) {
        router.push('/purchase');
        return;
      }
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
      const response = await fetch('/api/download/generate-token', { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate download token');
      }

      const data = await response.json();
      setDownloadData(data);
    } catch (err: any) {
      setError(err.message || tPage('generateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!downloadData?.downloadUrl) return;
    setDownloading(true);
    window.location.href = downloadData.downloadUrl;
    setTimeout(() => setDownloading(false), 5000);
  };

  const handleCopyChecksum = () => {
    if (downloadData?.version.checksum) {
      navigator.clipboard.writeText(downloadData.version.checksum);
    }
  };

  const installSteps = [
    { step: 1, title: tPage('steps.extractTitle'), desc: tPage('steps.extractDesc') },
    { step: 2, title: tPage('steps.installTitle'), desc: tPage('steps.installDesc') },
    { step: 3, title: tPage('steps.loginTitle'), desc: tPage('steps.loginDesc') },
    { step: 4, title: tPage('steps.playTitle'), desc: tPage('steps.playDesc') },
  ];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream px-4 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-green-main border-t-transparent" />
          <p className="text-brown-dark">{tPage('preparing')}</p>
        </div>
      </div>
    );
  }

  if (error && !downloadData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card bg-white p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mb-4 font-display text-2xl text-green-dark">{tPage('errorTitle')}</h1>
            <p className="mb-6 text-brown-dark">{error}</p>
            <button onClick={generateDownloadToken} className="btn-primary w-full">{tPage('retry')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="card mb-8 bg-white p-8">
          <div className="mb-6 flex items-center gap-6">
            <img src="/images/logo.png" alt="The Green Memoir" className="h-24 w-24" />
            <div className="flex-1">
              <h1 className="mb-2 font-display text-3xl text-green-dark">The Green Memoir</h1>
              {downloadData && (
                <div className="flex items-center gap-4">
                  <span className="bg-green-main px-3 py-1 text-sm font-bold text-white">
                    {downloadData.version.versionNumber}
                  </span>
                  <span className="text-brown-dark">{formatFileSize(downloadData.version.fileSize)}</span>
                </div>
              )}
            </div>
          </div>

          <button onClick={handleDownload} disabled={downloading} className="btn-primary mb-6 w-full py-4 text-xl">
            {downloading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {tPage('downloading')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {tPage('downloadWindows')}
              </span>
            )}
          </button>

          {downloadData && (
            <div className="rounded-lg border-2 border-border p-4">
              <button onClick={() => setShowChecksum(!showChecksum)} className="flex items-center gap-2 text-brown-dark hover:text-green-main">
                <svg className={`h-5 w-5 transition-transform ${showChecksum ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {tDownload('checksum')}
              </button>
              {showChecksum && (
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 break-all bg-cream-dark px-3 py-2 font-mono text-sm text-brown-dark">
                    {downloadData.version.checksum}
                  </code>
                  <button onClick={handleCopyChecksum} className="text-green-main hover:text-green-dark">📋</button>
                </div>
              )}
            </div>
          )}
        </div>

        {downloadData && (
          <div className="card mb-8 bg-white p-8">
            <h2 className="mb-4 font-display text-2xl text-green-dark">{tDownload('changelog')}</h2>
            <div className="prose prose-brown max-w-none">
              <div
                className="whitespace-pre-wrap text-brown-dark"
                dangerouslySetInnerHTML={{
                  __html: downloadData.version.changelog
                    .replace(/\n/g, '<br/>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/^- /gm, '<li>$1</li>'),
                }}
              />
            </div>
          </div>
        )}

        <div className="card bg-white p-8">
          <h2 className="mb-6 font-display text-2xl text-green-dark">{tPage('installationTitle')}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {installSteps.map((item) => (
              <div key={item.step} className="flex gap-4 rounded-lg bg-cream-dark p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-dark font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-heading text-lg text-green-dark">{item.title}</h3>
                  <p className="text-sm text-brown-dark">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
