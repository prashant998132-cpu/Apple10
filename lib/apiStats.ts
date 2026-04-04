// API usage tracking — lightweight, localStorage based
'use client';

export interface ApiStat {
  groq:        { used: number; limit: number; };
  gemini:      { used: number; limit: number; };
  mistral:     { used: number; limit: number; };
  together:    { used: number; limit: number; };
  deepseek:    { used: number; limit: number; };
  cerebras:    { used: number; limit: number; };
  openrouter:  { used: number; limit: number; };
  pollinations:{ used: number; limit: number; };
}

const LIMITS = {
  groq:         14400,
  gemini:        1500,
  mistral:        500,
  together:       1000,
  deepseek:       1000,
  cerebras:       5000,
  openrouter:     1000,
  pollinations:   9999, // unlimited fallback
};

const KEY = 'jarvis_api_stats';

function todayKey() { return new Date().toISOString().split('T')[0]; }

export function trackApiCall(provider: keyof typeof LIMITS) {
  if (typeof window === 'undefined') return;
  try {
    const today = todayKey();
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (!data[today]) data[today] = {};
    data[today][provider] = (data[today][provider] || 0) + 1;
    // Keep only last 7 days
    const keys = Object.keys(data).sort();
    if (keys.length > 7) delete data[keys[0]];
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function getApiStats(): ApiStat {
  const empty = Object.fromEntries(
    Object.entries(LIMITS).map(([k, limit]) => [k, { used: 0, limit }])
  ) as ApiStat;
  if (typeof window === 'undefined') return empty;
  try {
    const today = todayKey();
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    const d = data[today] || {};
    return Object.fromEntries(
      Object.entries(LIMITS).map(([k, limit]) => [k, { used: d[k] || 0, limit }])
    ) as ApiStat;
  } catch { return empty; }
}

export function getTotalApiCalls(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const today = todayKey();
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    const d = data[today] || {};
    return Object.values(d).reduce((sum: number, v: any) => sum + (v || 0), 0);
  } catch { return 0; }
}
