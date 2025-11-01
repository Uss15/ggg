const CACHE_NAME = 'sfep-v3';
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

  // Navigation requests: network-first with HTML fallback
  if (req.mode === 'navigate') {
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

  // Scripts and styles: network-first, fallback ONLY to cached asset (never HTML)
  if (['script', 'style'].includes(req.destination)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Other requests: cache-first
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
