// ══════════════════════════════════════════════════════════════
// JARVIS SMART CACHE — API limit guardian
// Prevents: Groq/Gemini/Vercel limits se wastage
// ══════════════════════════════════════════════════════════════
'use client';

// Cache TTLs — how long to reuse data before re-fetching
const TTL = {
  weather:   30 * 60 * 1000,  // 30 min — weather changes slowly
  crypto:    5  * 60 * 1000,  // 5 min  — prices move fast
  news:      15 * 60 * 1000,  // 15 min — news updates
  exchange:  60 * 60 * 1000,  // 1 hour — forex is slow
  joke:      60 * 60 * 1000,  // 1 hour — same joke is fine
  iss:       2  * 60 * 1000,  // 2 min  — ISS moves fast
  ai_flash:  0,               // Never cache AI responses
};

const KEY_PREFIX = 'jarvis_cache_';

// ── Get cached value ─────────────────────────────────────────
export function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (!raw) return null;
    const { data, ts, ttl } = JSON.parse(raw);
    if (Date.now() - ts > ttl) {
      localStorage.removeItem(KEY_PREFIX + key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

// ── Store in cache ────────────────────────────────────────────
export function setCached(key: string, data: any, ttlMs?: number): void {
  if (typeof window === 'undefined') return;
  const ttl = ttlMs ?? TTL[key as keyof typeof TTL] ?? 5 * 60 * 1000;
  try {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify({ data, ts: Date.now(), ttl }));
  } catch {}
}

// ── Smart deduplication — don't fire same tool twice ─────────
const pendingRequests = new Map<string, Promise<any>>();

export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  // Return cached first
  const cached = getCached<T>(key);
  if (cached !== null) return cached;

  // Deduplicate in-flight requests (prevent double-fire)
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  const promise = fetchFn().then(data => {
    setCached(key, data, ttlMs);
    pendingRequests.delete(key);
    return data;
  }).catch(err => {
    pendingRequests.delete(key);
    throw err;
  });

  pendingRequests.set(key, promise);
  return promise;
}

// ── AI request deduplication ──────────────────────────────────
// Prevent same message from firing twice (React strict mode / double render)
const recentAIRequests = new Map<string, number>();

export function isDuplicateAIRequest(text: string): boolean {
  if (typeof window === 'undefined') return false;
  const key = text.trim().slice(0, 100).toLowerCase();
  const last = recentAIRequests.get(key) || 0;
  const now = Date.now();
  if (now - last < 3000) return true; // same message within 3 seconds = duplicate
  recentAIRequests.set(key, now);
  // Clean old entries
  if (recentAIRequests.size > 50) {
    const oldest = [...recentAIRequests.entries()].sort((a, b) => a[1] - b[1])[0];
    recentAIRequests.delete(oldest[0]);
  }
  return false;
}

// ── Cache stats (for Settings page display) ──────────────────
export function getCacheStats(): { keys: number; sizeKB: number; hits: string[] } {
  if (typeof window === 'undefined') return { keys: 0, sizeKB: 0, hits: [] };
  const hits: string[] = [];
  let totalSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || '';
    if (key.startsWith(KEY_PREFIX)) {
      const val = localStorage.getItem(key) || '';
      totalSize += val.length;
      hits.push(key.replace(KEY_PREFIX, ''));
    }
  }
  return { keys: hits.length, sizeKB: Math.round(totalSize / 1024), hits };
}

// ── Clear all cache ───────────────────────────────────────────
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || '';
    if (key.startsWith(KEY_PREFIX)) toRemove.push(key);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
}

// ── Vercel function call counter ─────────────────────────────
// Track serverless invocations to stay under free tier
// Vercel Hobby: 100GB-hours / month, ~100K function calls
const VERCEL_KEY = 'jarvis_vercel_calls';
const VERCEL_MONTHLY_LIMIT = 90000; // 90K — leave 10K buffer

export function trackVercelCall(): void {
  if (typeof window === 'undefined') return;
  try {
    const month = new Date().toISOString().slice(0, 7); // "2026-03"
    const raw = localStorage.getItem(VERCEL_KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (data.month !== month) { data.month = month; data.count = 0; }
    data.count = (data.count || 0) + 1;
    localStorage.setItem(VERCEL_KEY, JSON.stringify(data));
  } catch {}
}

export function getVercelUsage(): { count: number; pct: number; safe: boolean } {
  if (typeof window === 'undefined') return { count: 0, pct: 0, safe: true };
  try {
    const month = new Date().toISOString().slice(0, 7);
    const raw = localStorage.getItem(VERCEL_KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (data.month !== month) return { count: 0, pct: 0, safe: true };
    const count = data.count || 0;
    const pct = Math.round(count / VERCEL_MONTHLY_LIMIT * 100);
    return { count, pct, safe: pct < 80 };
  } catch {
    return { count: 0, pct: 0, safe: true };
  }
}
