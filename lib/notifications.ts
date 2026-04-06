'use client';
export type NotifPriority = 'low' | 'medium' | 'high' | 'critical';
const SENT_KEY = 'jarvis_notif_sent';
const RATE_KEY = 'jarvis_notif_rate';
const RATE_LIMIT = 10;

function getRateCount(): number {
  if (typeof window === 'undefined') return 0;
  try { const d = JSON.parse(localStorage.getItem(RATE_KEY) || '{}'); return d[new Date().toISOString().slice(0, 13)] || 0; } catch { return 0; }
}
function incRate() {
  if (typeof window === 'undefined') return;
  try { const d = JSON.parse(localStorage.getItem(RATE_KEY) || '{}'); const h = new Date().toISOString().slice(0, 13); d[h] = (d[h] || 0) + 1; localStorage.setItem(RATE_KEY, JSON.stringify(d)); } catch {}
}
function wasSent(tag: string, ttl = 3600000): boolean {
  if (typeof window === 'undefined') return false;
  try { const d = JSON.parse(localStorage.getItem(SENT_KEY) || '{}'); const ts = d[tag]; return ts && (Date.now() - ts < ttl); } catch { return false; }
}
function markSent(tag: string) {
  if (typeof window === 'undefined') return;
  try { const d = JSON.parse(localStorage.getItem(SENT_KEY) || '{}'); d[tag] = Date.now(); localStorage.setItem(SENT_KEY, JSON.stringify(d)); } catch {}
}

export async function showSmartNotification(title: string, body: string, opts: { priority?: NotifPriority; tag?: string; ttl?: number; vibrate?: number[]; silent?: boolean } = {}): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  const tag = opts.tag || (title + '_' + body).slice(0, 50);
  const ttl = opts.ttl ?? (opts.priority === 'critical' ? 0 : 3600000);
  if (opts.priority !== 'critical' && getRateCount() >= RATE_LIMIT) return false;
  if (ttl > 0 && wasSent(tag, ttl)) return false;
  try {
    new Notification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-96.png', tag, silent: opts.silent || false });
    if (!opts.silent && navigator.vibrate) navigator.vibrate(opts.vibrate || [100, 50, 100]);
    markSent(tag);
    if (opts.priority !== 'critical') incRate();
    return true;
  } catch { return false; }
}

export async function requestPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export function notifyAchievement(title: string, xp: number) {
  showSmartNotification('🏆 ' + title, '+' + xp + ' XP mila! Keep going! 🔥', { priority: 'medium', tag: 'achievement_' + title, ttl: 86400000 });
}
export function notifyReminder(text: string, id: string) {
  showSmartNotification('⏰ JARVIS Reminder', text, { priority: 'high', tag: 'reminder_' + id, ttl: 300000 });
}
