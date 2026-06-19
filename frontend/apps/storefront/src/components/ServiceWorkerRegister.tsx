'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol !== 'http:' && window.location.hostname !== 'localhost') {
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[PWA] Service Worker registered scope:', reg.scope))
        .catch(err => console.error('[PWA] Service Worker registration failed:', err));
    } else if ('serviceWorker' in navigator) {
      // In local dev, register sw normally
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[PWA Local] Service Worker registered:', reg.scope))
        .catch(err => console.error('[PWA Local] SW Registration failed:', err));
    }
  }, []);

  return null;
}
