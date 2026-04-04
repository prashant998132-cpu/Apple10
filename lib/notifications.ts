'use client';

// ══════════════════════════════════════════════════════════════
// JARVIS Smart Notification Manager
// Features: dedup, rate limiting, priority queue, categories
// ══════════════════════════════════════════════════════════════

export type NotifCategory = 'weather' | 'reminder' | 'proactive' | 'system' | 'social' | 'achievement';
export type NotifPriority = 'low' | 'medium' | 'high' | 'critical';

interface NotifOpts {
  category?: NotifCategory;
  priority?: NotifPriority;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  silent?: boolean;
  tag?: string;
  onClick?: () => void;
  ttl?: number; // ms before this notif expires
}

const SENT_KEY = 'jarvis_notif_sent';
const RATE_KEY = 'jarvis_notif_rate';
const RATE_LIMIT = 10; // max per hour

function getRateLimitCount(): number {
  try {
    const d = JSON.parse(localStorage.getItem(RATE_KEY) || '{}');
    const hour = new Date().toISOString().slice(0, 13);
    return d[hour] || 0;
  } catch { return 0; }
}

function incrementRateLimit() {
  try {
    const d = JSON.parse(localStorage.getItem(RATE_KEY) || '{}');
    const hour = new Date().toISOString().slice(0, 13);
    d[hour] = (d[hour] || 0) + 1;
    // Keep only last 24 hours
    const keys = Object.keys(d).sort().slice(-24);
    const trimmed: Record<string, number> = {};
    keys.forEach(k => { trimmed[k] = d[k]; });
    localStorage.setItem(RATE_KEY, JSON.stringify(trimmed));
  } catch {}
}

function wasRecentlySent(tag: string, ttl = 3600000): boolean {
  try {
    const d = JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
    const ts = d[tag];
    return ts && (Date.now() - ts < ttl);
  } catch { return false; }
}

function markSent(tag: string) {
  try {
    const d = JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
    d[tag] = Date.now();
    // Cleanup old entries
    const now = Date.now();
    Object.keys(d).forEach(k => { if (now - d[k] > 86400000) delete d[k]; });
    localStorage.setItem(SENT_KEY, JSON.stringify(d));
  } catch {}
}

export async function showSmartNotification(
  title: string,
  body: string,
  opts: NotifOpts = {}
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const tag = opts.tag || `${title}_${body}`.slice(0, 50);
  const ttl = opts.ttl || (opts.priority === 'critical' ? 0 : 3600000);

  // Rate limiting (skip for critical)
  if (opts.priority !== 'critical' && getRateLimitCount() >= RATE_LIMIT) return false;

  // Dedup check
  if (ttl > 0 && wasRecentlySent(tag, ttl)) return false;

  const vibrate = opts.vibrate || (
    opts.priority === 'critical' ? [300, 100, 300, 100, 300] :
    opts.priority === 'high'     ? [200, 100, 200] :
    [100, 50, 100]
  );

  try {
    const notif = new Notification(title, {
      body,
      icon:   opts.icon   || '/icons/icon-192.png',
      badge:  opts.badge  || '/icons/icon-96.png',
      tag,
      silent: opts.silent || false,
    });

    if (!opts.silent && navigator.vibrate) navigator.vibrate(vibrate);
    if (opts.onClick) notif.onclick = opts.onClick;

    markSent(tag);
    if (opts.priority !== 'critical') incrementRateLimit();
    return true;
  } catch { return false; }
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// Show achievement notification
export function notifyAchievement(title: string, xp: number) {
  showSmartNotification(
    `🏆 ${title}`,
    `+${xp} XP mila! Keep going! 🔥`,
    { category: 'achievement', priority: 'medium', tag: `achievement_${title}`, ttl: 86400000 }
  );
}

// Show reminder notification
export function notifyReminder(text: string, id: string) {
  showSmartNotification(
    '⏰ JARVIS Reminder',
    text,
    { category: 'reminder', priority: 'high', tag: `reminder_${id}`, ttl: 300000, vibrate: [200, 100, 200] }
  );
}
