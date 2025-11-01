const CACHE_NAME = 'sfep-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch resources with smarter strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Network-first for navigation and critical assets to avoid stale blank pages
  if (req.mode === 'navigate' || ['script', 'style'].includes(req.destination)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(req);
          return cached || cache.match('/index.html');
        })
    );
    return;
  }

  // Cache-first for other requests
  event.respondWith(
    caches.match(req).then((response) => {
      return (
        response ||
        fetch(req).then((res) => {
          if (!res || res.status !== 200 || res.type !== 'basic') return res;
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
      );
    })
  );
});

// Activate and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-evidence') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Retrieve queued actions from IndexedDB
  // Process each action
  // Clear queue on success
}
