// JARVIS Service Worker v5
// Cache · BG Sync · Push · Periodic Sync · Offline Queue · Badge

const CACHE_VER   = 'jarvis-v5';
const STATIC_CACHE = `${CACHE_VER}-static`;
const DATA_CACHE   = `${CACHE_VER}-data`;
const PRECACHE     = ['/', '/manifest.json'];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== STATIC_CACHE && k !== DATA_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch Strategy ───────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API — network only with offline fallback
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline', cached: false }), {
          headers: { 'Content-Type': 'application/json' }, status: 503,
        })
      )
    );
    return;
  }

  // External — network only
  if (!url.hostname.includes('apple10.vercel') && !url.hostname.includes('localhost')) {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  // Static assets — cache first (immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        caches.open(STATIC_CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }))
    );
    return;
  }

  // Pages — network first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) caches.open(STATIC_CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request).then(c => c || new Response('Offline', { status: 503 })))
  );
});

// ── Background Sync — offline message queue ──────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'jarvis-offline-queue') {
    e.waitUntil(flushOfflineQueue());
  }
  if (e.tag === 'jarvis-data-prefetch') {
    e.waitUntil(prefetchData());
  }
});

async function flushOfflineQueue() {
  const queue = await getFromIDB('offline_queue') || [];
  if (!queue.length) return;
  const remaining = [];
  for (const item of queue) {
    try {
      const r = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!r.ok) remaining.push(item);
    } catch { remaining.push(item); }
  }
  await setInIDB('offline_queue', remaining);
  if (!remaining.length) {
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.postMessage({ type: 'QUEUE_FLUSHED', count: queue.length }));
  }
}

async function prefetchData() {
  // Hourly prefetch — weather + crypto cached for chat
  try {
    const [w, c] = await Promise.allSettled([
      fetch('https://api.open-meteo.com/v1/forecast?latitude=24.53&longitude=81.3&current=temperature_2m,weathercode&timezone=Asia/Kolkata'),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=inr'),
    ]);
    if (w.status === 'fulfilled' && w.value.ok) {
      const data = await w.value.json();
      await setInIDB('cache_weather', { data, ts: Date.now() });
    }
    if (c.status === 'fulfilled' && c.value.ok) {
      const data = await c.value.json();
      await setInIDB('cache_crypto', { data, ts: Date.now() });
    }
  } catch {}
}

// ── Periodic Background Sync ─────────────────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'jarvis-hourly') {
    e.waitUntil(prefetchData());
  }
  if (e.tag === 'jarvis-morning') {
    e.waitUntil(checkMorningBriefing());
  }
});

async function checkMorningBriefing() {
  const hour = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false });
  if (parseInt(hour) !== 8) return;
  const sent = await getFromIDB('morning_sent_' + new Date().toDateString());
  if (sent) return;
  await setInIDB('morning_sent_' + new Date().toDateString(), true);
  const cached = await getFromIDB('cache_weather');
  const w = cached?.data?.current;
  const wc = (c) => c <= 1 ? '☀️' : c <= 3 ? '⛅' : '🌧️';
  const weatherStr = w ? `${Math.round(w.temperature_2m)}°C ${wc(w.weathercode)}` : '';
  self.registration.showNotification('🌅 Good Morning Jons Bhai!', {
    body: `${weatherStr} — JARVIS ready hai. Aaj ka din badhiya rahega! 💪`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    tag: 'morning-brief',
    data: { url: '/?cmd=brief' },
    actions: [
      { action: 'open', title: '💬 Open JARVIS' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
}

// ── Push Notifications (VAPID) ───────────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || '🤖 JARVIS', {
      body: data.body || data.message || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: data.tag || 'jarvis',
      data: { url: data.url || '/' },
      vibrate: [100, 50, 100],
      actions: data.actions || [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// ── Notification Click ───────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  if (e.action === 'dismiss') return;

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing window if open
      for (const c of clients) {
        if (c.url.includes('apple10.vercel') || c.url.includes('localhost')) {
          c.focus();
          c.postMessage({ type: 'NOTIFICATION_CLICK', url, action: e.action });
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// ── Reminder System ─────────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SET_REMINDER') {
    const { task, ms, id } = e.data;
    setTimeout(async () => {
      self.registration.showNotification('⏰ JARVIS Reminder', {
        body: task,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        tag: `reminder-${id}`,
        vibrate: [100, 50, 100, 50, 100],
        data: { url: '/', type: 'reminder' },
        actions: [
          { action: 'open', title: '💬 Open' },
          { action: 'snooze', title: '⏰ 10 min' },
        ],
      });
    }, ms);
  }

  if (e.data?.type === 'QUEUE_MESSAGE') {
    // Store message for offline sync
    getFromIDB('offline_queue').then(queue => {
      const q = queue || [];
      q.push(e.data.payload);
      setInIDB('offline_queue', q);
    });
  }

  if (e.data?.type === 'REGISTER_PERIODIC_SYNC') {
    self.registration.periodicSync?.register('jarvis-hourly', { minInterval: 60 * 60 * 1000 }).catch(() => {});
    self.registration.periodicSync?.register('jarvis-morning', { minInterval: 30 * 60 * 1000 }).catch(() => {});
  }
});

// ── IDB Helpers ──────────────────────────────────────────────
function getFromIDB(key) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('jarvis-sw', 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('store')) db.createObjectStore('store');
    };
    req.onsuccess = () => {
      const tx = req.result.transaction('store', 'readonly');
      const r = tx.objectStore('store').get(key);
      r.onsuccess = () => resolve(r.result ?? null);
      r.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}

function setInIDB(key, val) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('jarvis-sw', 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('store')) db.createObjectStore('store');
    };
    req.onsuccess = () => {
      const tx = req.result.transaction('store', 'readwrite');
      tx.objectStore('store').put(val, key);
      tx.oncomplete = () => resolve(undefined);
      tx.onerror = () => resolve(undefined);
    };
    req.onerror = () => resolve(undefined);
  });
}
