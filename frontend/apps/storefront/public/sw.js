const CACHE_NAME = 'ecomm-pwa-cache-v1';
const ASSETS = [
  '/',
  '/offline.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests and exclude next.js dev stuff
  if (e.request.method !== 'GET' || e.request.url.includes('/_next/') || e.request.url.includes('webpack')) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, copy);
        });
        return res;
      })
      .catch(() => {
        return caches.match(e.request).then((res) => {
          return res || caches.match('/offline.html');
        });
      })
  );
});
