'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || /(^|\/)admin(\/|$)/.test(pathname)) {
      return;
    }

    void fetch('/api/analytics/page-view', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pathname }),
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
