const CACHE_NAME = 'ranktica-v3';

// Core assets to pre-cache on service worker installation
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Active Pre-caching initiated...');
      // Safe addAll to prevent complete install block if external font fails
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn(`[Service Worker] Failed to precache asset during installation: ${url}`, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[Service Worker] Pruning deprecated cache store: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip caching for APIs, WebSockets, metrics, or non-GET requests
  if (
    e.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') || 
    url.pathname.includes('/ws') ||
    url.protocol.startsWith('ws') ||
    url.hostname.includes('firestore.googleapis.com')
  ) {
    return;
  }

  // SPA Navigation Fallback Rule:
  // If the user navigates to a virtual path while offline (e.g., /dashboard, /projects, /reports),
  // capture the document request and return cached /index.html.
  const isNavigationRequest = e.request.mode === 'navigate' || 
    (e.request.headers.get('Accept') && e.request.headers.get('Accept').includes('text/html'));

  if (isNavigationRequest) {
    e.respondWith(
      fetch(e.request).catch((err) => {
        console.log('[Service Worker] Navigation request offline. Serving graceful offline.html fallback...', err);
        return caches.match('/offline.html') || caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Advanced Asset Caching Rules:
  // 1. Immutable & Constant Third-party CDN libraries (Tailwind, Google Fonts) -> Cache First
  const isImmutableCDN = url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdn.tailwindcss.com') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff');

  if (isImmutableCDN) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache immediately
          return cachedResponse;
        }
        return fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Local App Code Bundles (JS, CSS chunks) -> Network First, falling back to cache
  const isLocalAsset = url.origin === self.location.origin && 
    (url.pathname.includes('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css'));

  if (isLocalAsset) {
    e.respondWith(
      fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(e.request);
      })
    );
    return;
  }

  // 3. Stale-While-Revalidate cache strategy for other general assets (static styles, local static files)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Suppress console spam when offline
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// ==========================================================
// Service Worker-based Offline Synchronization Layer
// ==========================================================
let offlineSyncQueue = [];

self.addEventListener('message', (e) => {
  if (!e.data) return;

  if (e.data.type === 'QUEUE_OFFLINE_CHANGE') {
    const change = e.data.payload;
    // Check if we already have this project update queued, if so replace it to prevent duplicate keys/extra writes
    const existingIndex = offlineSyncQueue.findIndex(item => item.project && item.project.id === change.project?.id);
    if (existingIndex !== -1) {
      offlineSyncQueue[existingIndex] = change;
    } else {
      offlineSyncQueue.push(change);
    }
    
    // Broadcast status back to keep all tabs informed
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'OFFLINE_QUEUE_UPDATED',
          queueSize: offlineSyncQueue.length,
          queue: offlineSyncQueue,
          latestQueuedId: change.id
        });
      });
    });
  }

  if (e.data.type === 'GET_SYNC_QUEUE') {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'OFFLINE_QUEUE_UPDATED',
          queueSize: offlineSyncQueue.length,
          queue: offlineSyncQueue
        });
      });
    });
  }

  if (e.data.type === 'TRIGGER_SYNC_DRAIN') {
    // Push queued items back to tabs where firebase is active to perform actual Firestore drain
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_FLUSH_REQUEST',
          queue: [...offlineSyncQueue]
        });
      });
    });
  }

  if (e.data.type === 'CLEAR_SYNC_QUEUE') {
    offlineSyncQueue = [];
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'OFFLINE_QUEUE_UPDATED',
          queueSize: 0,
          queue: []
        });
      });
    });
  }
});
