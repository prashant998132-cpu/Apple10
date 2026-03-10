// API usage tracking — lightweight, localStorage based
'use client';

export interface ApiStat {
  groq:    { used: number; limit: number; };
  gemini:  { used: number; limit: number; };
  mistral: { used: number; limit: number; };
}

const LIMITS = {
  groq:    14400,
  gemini:  1500,
  mistral: 500,
};

const KEY = 'jarvis_api_stats';

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

export function trackApiCall(provider: 'groq' | 'gemini' | 'mistral') {
  if (typeof window === 'undefined') return;
  try {
    const today = todayKey();
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (!data[today]) data[today] = { groq: 0, gemini: 0, mistral: 0 };
    data[today][provider] = (data[today][provider] || 0) + 1;
    // Keep only last 7 days
    const keys = Object.keys(data).sort();
    if (keys.length > 7) delete data[keys[0]];
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function getApiStats(): ApiStat {
  if (typeof window === 'undefined') return {
    groq: { used: 0, limit: LIMITS.groq },
    gemini: { used: 0, limit: LIMITS.gemini },
    mistral: { used: 0, limit: LIMITS.mistral },
  };
  try {
    const today = todayKey();
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    const d = data[today] || {};
    return {
      groq:    { used: d.groq    || 0, limit: LIMITS.groq    },
      gemini:  { used: d.gemini  || 0, limit: LIMITS.gemini  },
      mistral: { used: d.mistral || 0, limit: LIMITS.mistral },
    };
  } catch {
    return {
      groq:    { used: 0, limit: LIMITS.groq    },
      gemini:  { used: 0, limit: LIMITS.gemini  },
      mistral: { used: 0, limit: LIMITS.mistral },
    };
  }
}
