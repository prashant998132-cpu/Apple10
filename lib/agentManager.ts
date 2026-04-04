// ══════════════════════════════════════════════════════════════
// JARVIS AGENT MANAGER — Background intelligence coordinator
// Manages: SW periodic sync, push notifs, Telegram, reminders
// ══════════════════════════════════════════════════════════════
'use client';

export interface AgentTask {
  id: string;
  type: 'notify' | 'remind' | 'prefetch' | 'webhook';
  title?: string;
  body?: string;
  url?: string;
  time?: number; // Unix timestamp for reminders
  data?: any;
}

// ── Initialize all background agents ─────────────────────────
export async function initAgents(onMessage: (msg: string) => void) {
  if (typeof window === 'undefined') return;

  // 1. Register periodic background sync (Android Chrome only)
  await registerPeriodicSync();

  // 2. Send profile to SW for background proactive
  try {
    const sw = await navigator.serviceWorker.ready;
    const prof = JSON.parse(localStorage.getItem('jarvis_profile') || '{}');
    const loc  = JSON.parse(localStorage.getItem('jarvis_location') || '{}');
    sw.active?.postMessage({
      type: 'STORE_PROFILE',
      name: prof.name || 'Bhai',
      lat:  loc.lat  || 24.5362,
      lon:  loc.lon  || 81.3003,
      city: loc.city || prof.location?.split(',')[0] || 'Maihar',
    });
  } catch {}

  // 3. Request notification permission
  await requestNotificationPermission();

  // 3. Load cached data from IDB (instant startup)
  await loadCachedData(onMessage);
}

// ── Periodic Background Sync ──────────────────────────────────
async function registerPeriodicSync() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const sw = await navigator.serviceWorker.ready;
    // @ts-ignore — Periodic Sync API (Chrome Android)
    if ('periodicSync' in sw) {
      // @ts-ignore
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (status.state === 'granted') {
        // @ts-ignore
        await sw.periodicSync.register('jarvis-hourly', { minInterval: 60 * 60 * 1000 });
        // @ts-ignore
        await sw.periodicSync.register('jarvis-reminders', { minInterval: 5 * 60 * 1000 });
        console.log('✅ Periodic background sync registered');
      }
    }
  } catch (e) {
    console.log('Periodic sync not supported (normal on desktop)');
  }
}

// ── Notifications ─────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function showNotification(title: string, body: string, url = '/') {
  if (!('serviceWorker' in navigator)) return;
  const sw = await navigator.serviceWorker.ready;
  sw.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url },
  } as any);
}

// ── Smart Reminder System ─────────────────────────────────────
export async function setReminder(text: string, delayMs: number) {
  if (typeof window === 'undefined') return false;
  const reminder = {
    id: `r_${Date.now()}`,
    text,
    time: Date.now() + delayMs,
    done: false,
  };

  // Store in IDB for SW to pick up
  const reminders = getReminders();
  reminders.push(reminder);
  try {
    localStorage.setItem('jarvis_reminders', JSON.stringify(reminders));
  } catch {}

  // Also register a background sync to ensure it fires
  if ('serviceWorker' in navigator) {
    const sw = await navigator.serviceWorker.ready;
    // @ts-ignore
    if ('sync' in sw) await sw.sync.register('jarvis-reminders');
  }

  return true;
}

export function getReminders(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('jarvis_reminders') || '[]');
  } catch {
    return [];
  }
}

// ── Parse reminder from natural language ─────────────────────
export function parseReminderIntent(text: string): { ms: number; task: string } | null {
  const t = text.toLowerCase();

  // "30 min mein remind karo xyz"
  const minMatch = t.match(/(\d+)\s*(min|minute)\s*(?:mein|me|ke baad|after)?\s*(.+)/i);
  if (minMatch) return { ms: parseInt(minMatch[1]) * 60000, task: minMatch[3] || text };

  // "2 ghante mein"
  const hrMatch = t.match(/(\d+)\s*(ghante|hour|hr)\s*(?:mein|me|ke baad)?\s*(.+)/i);
  if (hrMatch) return { ms: parseInt(hrMatch[1]) * 3600000, task: hrMatch[3] || text };

  // "kal 8 baje"
  const tomorrowMatch = t.match(/kal\s+(\d+)\s*(am|pm|baje)/i);
  if (tomorrowMatch) {
    let hour = parseInt(tomorrowMatch[1]);
    if (tomorrowMatch[2].toLowerCase() === 'pm' && hour < 12) hour += 12;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, 0, 0, 0);
    return { ms: tomorrow.getTime() - Date.now(), task: t.replace(/kal.+?(?:baje|am|pm)/i, '').trim() || text };
  }

  return null;
}

// ── Queue a task for SW to execute in background ──────────────
export async function queueAgentTask(task: AgentTask) {
  if (typeof window === 'undefined') return;
  try {
    const tasks = JSON.parse(localStorage.getItem('jarvis_task_queue') || '[]');
    tasks.push(task);
    localStorage.setItem('jarvis_task_queue', JSON.stringify(tasks));

    if ('serviceWorker' in navigator) {
      const sw = await navigator.serviceWorker.ready;
      // @ts-ignore
      if ('sync' in sw) await sw.sync.register('jarvis-background-tasks');
    }
  } catch {}
}

// ── Load cached data from previous background fetch ──────────
async function loadCachedData(onMessage: (msg: string) => void) {
  // Check if we have fresh cached data from SW background fetch
  try {
    const cached = localStorage.getItem('jarvis_bg_cache');
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      const age = Date.now() - ts;
      if (age < 3600000 && data.weather) { // < 1 hour old
        const w = data.weather?.current;
        if (w) {
          const wc = (c: number) => c <= 1 ? '☀️' : c <= 3 ? '⛅' : '🌧️';
          onMessage(`📡 *Background agent update:*\n🌤️ Weather: ${Math.round(w.temperature_2m)}°C ${wc(w.weathercode)}\n_(${Math.round(age / 60000)} min pehle fetch hua)_`);
        }
      }
    }
  } catch {}
}

// ── Telegram webhook setup helper ────────────────────────────
export async function setupTelegramWebhook(botToken: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://apple10.vercel.app/api/telegram' }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// ── MacroDroid device event handler ──────────────────────────
export function onDeviceEvent(event: string, value: string, onMessage: (msg: string) => void) {
  switch (event) {
    case 'battery_low':
      onMessage(`⚡ **Battery ${value}%** — Charger lagao!`);
      break;
    case 'location_home':
      onMessage(`🏠 **Ghar aa gaye!** Aaj kaisa raha din?`);
      break;
    case 'wifi_connected':
      onMessage(`📶 **${value} se connect ho gaya.** JARVIS full mode mein hai!`);
      break;
    case 'charging_started':
      onMessage(`⚡ **Charging shuru.** ${value}% se charge ho raha hai.`);
      break;
  }
}
