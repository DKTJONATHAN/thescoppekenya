// ============================================
// Za Ndani PWA Service Worker
// Version: 1.0.0
// ============================================

const CACHE_NAME = 'zandani-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/logo.png',
  '/favicon.ico'
];

// File extensions to cache (runtime)
const CACHEABLE_EXTENSIONS = [
  '.js', '.css', '.html', '.json',
  '.png', '.jpg', '.jpeg', '.webp', '.svg',
  '.woff', '.woff2', '.ttf'
];

// API routes to NOT cache (fresh data always)
const NO_CACHE_PATTERNS = [
  '/api/',
  '/get-views',
  '/analytics',
  '/ads.txt'
];

// ============================================
// Helper: Check if URL should be cached
// ============================================
function shouldCache(url) {
  // Don't cache chrome-extension or devtools
  if (!url.startsWith('https') && !url.startsWith('http')) return false;
  
  // Don't cache analytics or ads
  if (url.includes('google-analytics') || 
      url.includes('googletagmanager') ||
      url.includes('pagead2') ||
      url.includes('doubleclick')) return false;
  
  // Don't cache API endpoints
  for (const pattern of NO_CACHE_PATTERNS) {
    if (url.includes(pattern)) return false;
  }
  
  // Cache static assets with extensions
  for (const ext of CACHEABLE_EXTENSIONS) {
    if (url.includes(ext)) return true;
  }
  
  // Cache same-origin HTML pages
  try {
    const urlObj = new URL(url);
    if (urlObj.origin === self.location.origin && !urlObj.pathname.includes('.')) {
      return true;
    }
  } catch (e) {
    return false;
  }
  
  return false;
}

// ============================================
// Install Event - Cache core assets
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching preload assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Force waiting service worker to become active
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// ============================================
// Activate Event - Clean up old caches
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// ============================================
// Fetch Event - Serve cached content when offline
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // HTML requests - Network first, fallback to cache, then offline page
  if (request.mode === 'navigate' || 
      (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh HTML for offline use
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(async () => {
          // Offline: try cache first
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // Static assets - Cache first, network fallback
  if (shouldCache(url.href)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version, update in background
            event.waitUntil(
              fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, networkResponse);
                  });
                }
              }).catch(() => {})
            );
            return cachedResponse;
          }
          
          // Not in cache, fetch from network
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
            return networkResponse;
          });
        })
        .catch(() => {
          // Offline and not in cache - return fallback for images
          if (url.href.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return caches.match('/logo.png');
          }
          return new Response('Offline - content unavailable', { status: 404 });
        })
    );
    return;
  }
  
  // Everything else - Network only (no caching)
  event.respondWith(fetch(request));
});

// ============================================
// Message Event - Handle PWA update notifications
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================================
// Push Event - For future notifications (optional)
// ============================================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New story just dropped!',
    icon: '/logo.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Za Ndani News', options)
  );
});

// ============================================
// Notification Click Event
// ============================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// Periodic Background Sync (Optional - for news updates)
// ============================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'fetch-latest-news') {
    event.waitUntil(
      fetch('/api/latest')
        .then(response => response.json())
        .then(data => {
          // Cache latest news for offline reading
          const cache = await caches.open(CACHE_NAME);
          cache.put('/api/latest-cached', new Response(JSON.stringify(data)));
        })
        .catch(err => console.error('Periodic sync failed:', err))
    );
  }
});