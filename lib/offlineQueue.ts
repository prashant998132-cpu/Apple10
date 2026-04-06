'use client';
interface QueuedRequest { id: string; url: string; method: string; body?: string; headers?: Record<string, string>; timestamp: number; retries: number; }
const QUEUE_KEY = 'jarvis_offline_queue';
const MAX_RETRIES = 3;

function loadQueue(): QueuedRequest[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}
function saveQueue(q: QueuedRequest[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-50))); } catch {}
}

export function enqueue(url: string, method: string, body?: any, headers?: Record<string, string>) {
  if (typeof window === 'undefined') return;
  const q = loadQueue();
  q.push({ id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2), url, method, body: body ? JSON.stringify(body) : undefined, headers, timestamp: Date.now(), retries: 0 });
  saveQueue(q);
}

export async function flushQueue(): Promise<number> {
  if (typeof window === 'undefined' || !navigator.onLine) return 0;
  const q = loadQueue(); if (q.length === 0) return 0;
  let flushed = 0; const remaining: QueuedRequest[] = [];
  for (const req of q) {
    if (req.retries >= MAX_RETRIES) continue;
    try {
      const r = await fetch(req.url, { method: req.method, body: req.body, headers: req.headers, signal: AbortSignal.timeout(10000) });
      if (r.ok) { flushed++; } else { remaining.push({ ...req, retries: req.retries + 1 }); }
    } catch { remaining.push({ ...req, retries: req.retries + 1 }); }
  }
  saveQueue(remaining); return flushed;
}

export function getQueueSize(): number {
  if (typeof window === 'undefined') return 0;
  return loadQueue().length;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushQueue().then(n => { if (n > 0) console.log('[JARVIS Queue] Flushed:', n); }); });
}
