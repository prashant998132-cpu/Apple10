// JARVIS Service Worker v3 — TWA Optimized
// Strategy: Cache-first for static, Network-first for API, offline fallback

const CACHE_VERSION = 'jarvis-v3';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const API_CACHE     = `${CACHE_VERSION}-api`;

// Static assets to precache
const PRECACHE = [
  '/',
  '/manifest.json',
  '/.well-known/assetlinks.json',
];

// API routes that can be cached briefly
const CACHE_API_ROUTES = [
  // Cache weather for 10 min, news for 5 min handled in response headers
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — clean old caches ──────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== STATIC_CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // 1. API routes — network only, never cache AI responses
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(request).catch(() =>
      new Response(JSON.stringify({ error: 'Offline — no network' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
      })
    ));
    return;
  }

  // 2. External APIs — network only
  if (!url.hostname.includes('apple10.vercel.app') && !url.hostname.includes('localhost')) {
    e.respondWith(fetch(request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  // 3. Next.js static assets (_next/) — cache first
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // 4. Pages — network first, cache fallback (so TWA gets updates)
  e.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request).then(cached => cached || new Response('Offline', { status: 503 })))
  );
});

// ── Push notifications ────────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'JARVIS', body: 'New message' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'JARVIS', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
      actions: [
        { action: 'open',    title: '💬 Open' },
        { action: 'dismiss', title: '✕ Dismiss' },
      ],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'open' || !e.action) {
    e.waitUntil(clients.openWindow(e.notification.data?.url || '/'));
  }
});
