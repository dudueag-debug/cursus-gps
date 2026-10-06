const CACHE_NAME = 'to-passando-gps-v6-fresh';
const STATIC_ASSETS = [
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];

// Install: Cache static icons
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache notice:', err);
      });
    })
  );
});

// Activate: Delete all previous caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
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

// Fetch: Network-First with cache fallback for everything during development
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass cross-origin requests (Leaflet tiles, OSM, APIs, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Bypass API routes
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Always Network-First so mobile phones get live updates without cache freezing
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
