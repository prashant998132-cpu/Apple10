// ══════════════════════════════════════════════════════════════
// CONNECTED APPS — JARVIS ko pata hai kaunse apps available hain
// Chat mein "image banao" → auto Pollinations use karo
// Chat mein "weather" → Open-Meteo use karo
// Koi bhi app connect/disconnect — JARVIS automatically use karta hai
// ══════════════════════════════════════════════════════════════
'use client';

export type AppId =
  | 'pollinations_image'  // Image generation — free, no key
  | 'pollinations_text'   // Text AI — free fallback
  | 'groq'               // Fast AI (Flash mode)
  | 'gemini'             // Deep AI + tools
  | 'mistral'            // Mid-tier AI
  | 'openrouter'         // Free models gateway
  | 'openmeteo'          // Weather — no key
  | 'newsdata'           // News — free key
  | 'nasa_apod'          // NASA daily photo — free key
  | 'arxiv'              // Research papers — no key
  | 'alpha_vantage'      // Stocks — free key
  | 'youtube'            // YouTube search — free key
  | 'github'             // GitHub repos — free key
  | 'spotify_preview'    // Spotify 30s preview — no key
  | 'open_library'       // Books — no key
  | 'unsplash'           // Photos — free key

export interface AppDef {
  id: AppId;
  name: string;
  icon: string;
  category: 'ai' | 'media' | 'info' | 'productivity';
  desc: string;
  keyRequired: boolean;
  keyLabel?: string;
  keyPlaceholder?: string;
  triggers: string[];      // keywords jo is app ko trigger karenge
  freeForever?: boolean;   // no API key ever needed
}

export const APP_DEFS: AppDef[] = [
  // ── AI ──────────────────────────────────────────
  { id: 'pollinations_image', name: 'Image Generator', icon: '🎨', category: 'ai',
    desc: 'AI images — no key, free forever', keyRequired: false, freeForever: true,
    triggers: ['image', 'photo', 'picture', 'draw', 'generate image', 'banao image', 'tasveer', 'wallpaper', 'art'] },
  { id: 'groq', name: 'Groq (Flash AI)', icon: '⚡', category: 'ai',
    desc: 'llama-3.3-70b — fastest responses', keyRequired: true, keyLabel: 'GROQ_API_KEY', keyPlaceholder: 'gsk_...',
    triggers: ['fast', 'quick', 'chat', 'explain', 'code'] },
  { id: 'gemini', name: 'Gemini (Deep AI)', icon: '🧠', category: 'ai',
    desc: 'Google Gemini 2.0 Flash — complex tasks', keyRequired: true, keyLabel: 'GEMINI_API_KEY', keyPlaceholder: 'AIza...',
    triggers: ['analyze', 'research', 'deep', 'think', 'complex'] },
  { id: 'mistral', name: 'Mistral', icon: '🌀', category: 'ai',
    desc: 'Mid-tier fallback AI', keyRequired: true, keyLabel: 'MISTRAL_API_KEY', keyPlaceholder: 'mt-...',
    triggers: [] },
  { id: 'openrouter', name: 'OpenRouter', icon: '🔀', category: 'ai',
    desc: 'Free models gateway — Gemma 3 27B', keyRequired: true, keyLabel: 'OPENROUTER_API_KEY', keyPlaceholder: 'sk-or-...',
    triggers: [] },

  // ── Media ────────────────────────────────────────
  { id: 'spotify_preview', name: 'Spotify Preview', icon: '🎵', category: 'media',
    desc: '30-sec song previews — no key', keyRequired: false, freeForever: true,
    triggers: ['song', 'music', 'gaana', 'play', 'sunao', 'spotify'] },
  { id: 'unsplash', name: 'Unsplash Photos', icon: '📷', category: 'media',
    desc: 'Free HD photos', keyRequired: true, keyLabel: 'UNSPLASH_ACCESS_KEY', keyPlaceholder: 'your_access_key',
    triggers: ['photo', 'picture', 'real image', 'stock photo'] },
  { id: 'nasa_apod', name: 'NASA APOD', icon: '🚀', category: 'media',
    desc: 'NASA Astronomy Photo of the Day', keyRequired: true, keyLabel: 'NASA_API_KEY', keyPlaceholder: 'DEMO_KEY or yours',
    triggers: ['nasa', 'space', 'astronomy', 'universe', 'planet', 'stars', 'galaxy'] },

  // ── Info ────────────────────────────────────────
  { id: 'openmeteo', name: 'Weather', icon: '🌤️', category: 'info',
    desc: 'Open-Meteo — no key, real-time', keyRequired: false, freeForever: true,
    triggers: ['weather', 'mausam', 'temperature', 'rain', 'forecast', 'aaj ka mausam'] },
  { id: 'newsdata', name: 'News', icon: '📰', category: 'info',
    desc: 'NewsData.io — latest headlines', keyRequired: true, keyLabel: 'NEWSDATA_API_KEY', keyPlaceholder: 'pub_...',
    triggers: ['news', 'khabar', 'headlines', 'today news', 'latest news', 'breaking'] },
  { id: 'arxiv', name: 'arXiv Research', icon: '🔬', category: 'info',
    desc: 'Scientific papers — no key', keyRequired: false, freeForever: true,
    triggers: ['research', 'paper', 'arxiv', 'science', 'study', 'journal'] },
  { id: 'alpha_vantage', name: 'Stock Market', icon: '📈', category: 'info',
    desc: 'Live stock/crypto prices', keyRequired: true, keyLabel: 'ALPHA_VANTAGE_KEY', keyPlaceholder: 'your_key',
    triggers: ['stock', 'share price', 'nifty', 'sensex', 'market', 'equity'] },
  { id: 'youtube', name: 'YouTube Search', icon: '▶️', category: 'info',
    desc: 'Search videos by keyword', keyRequired: true, keyLabel: 'YOUTUBE_API_KEY', keyPlaceholder: 'AIza...',
    triggers: ['youtube', 'video', 'watch', 'tutorial', 'dekhao', 'search video'] },
  { id: 'github', name: 'GitHub', icon: '🐙', category: 'productivity',
    desc: 'Search repos & code', keyRequired: false, freeForever: true,
    triggers: ['github', 'repo', 'code search', 'open source', 'library'] },
  { id: 'open_library', name: 'Open Library', icon: '📚', category: 'info',
    desc: 'Book search — no key', keyRequired: false, freeForever: true,
    triggers: ['book', 'kitaab', 'novel', 'author', 'read', 'library'] },
];

const KEYS_KEY    = 'jarvis_app_keys';
const ENABLED_KEY = 'jarvis_enabled_apps';

// ── Read/Write connected apps ──────────────────────
export function getAppKeys(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(KEYS_KEY) || '{}'); } catch { return {}; }
}

export function saveAppKey(appId: AppId, key: string) {
  if (typeof window === 'undefined') return;
  const keys = getAppKeys();
  if (key) keys[appId] = key; else delete keys[appId];
  try { localStorage.setItem(KEYS_KEY, JSON.stringify(keys)); } catch {}
}

export function getEnabledApps(): AppId[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(localStorage.getItem(ENABLED_KEY) || 'null');
    if (stored) return stored;
    // Defaults — free apps auto-enabled
    return APP_DEFS.filter(a => a.freeForever).map(a => a.id) as AppId[];
  } catch { return []; }
}

export function setAppEnabled(appId: AppId, enabled: boolean) {
  if (typeof window === 'undefined') return;
  const apps = getEnabledApps();
  const next = enabled ? [...new Set([...apps, appId])] : apps.filter(a => a !== appId);
  try { localStorage.setItem(ENABLED_KEY, JSON.stringify(next)); } catch {}
}

export function isAppEnabled(appId: AppId): boolean {
  return getEnabledApps().includes(appId);
}

// ── Intent → App routing ──────────────────────────
export function detectAppsForQuery(query: string): AppId[] {
  const q = query.toLowerCase();
  const enabled = getEnabledApps();
  const matched: AppId[] = [];

  for (const app of APP_DEFS) {
    if (!enabled.includes(app.id)) continue;
    if (app.triggers.some(t => q.includes(t))) {
      matched.push(app.id);
    }
  }
  return matched;
}

// ── Get key for an app ─────────────────────────────
export function getKey(appId: AppId): string {
  const keys = getAppKeys();
  // Also check env vars stored in localStorage
  return keys[appId] || '';
}

// ── App status check ──────────────────────────────
export function getAppStatus(app: AppDef): 'ready' | 'needs_key' | 'disabled' {
  const enabled = getEnabledApps();
  if (!enabled.includes(app.id)) return 'disabled';
  if (!app.keyRequired || app.freeForever) return 'ready';
  const key = getKey(app.id);
  return key ? 'ready' : 'needs_key';
}
