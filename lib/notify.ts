// ══════════════════════════════════════════════════════════════
// JARVIS NOTIFY — Telegram alternative using ntfy.sh
// ══════════════════════════════════════════════════════════════
// WHY NTFY.SH:
//   ✅ 100% FREE — no account needed
//   ✅ No ban risk — open source server
//   ✅ Android app available (Play Store)
//   ✅ Works via HTTP — no SDK needed
//   ✅ JARVIS → Phone notifications instantly
//   ✅ Priority levels, icons, action buttons
//
// SETUP (2 min):
//   1. Play Store mein "ntfy" app install karo
//   2. Subscribe to topic: jarvis-pranshu-2026 (ya koi bhi unique naam)
//   3. Vercel env: NTFY_TOPIC=jarvis-pranshu-2026
//   Optional: NTFY_SERVER=https://ntfy.sh (default)
// ══════════════════════════════════════════════════════════════

export interface NtfyOptions {
  title?: string;
  priority?: 1 | 2 | 3 | 4 | 5; // 1=min, 3=default, 5=urgent
  tags?: string[];               // emoji tags: ["warning", "battery"]
  clickUrl?: string;
  actions?: Array<{ label: string; url: string }>;
}

const SERVER = process.env.NTFY_SERVER || 'https://ntfy.sh';
const TOPIC  = process.env.NTFY_TOPIC  || '';  // Must be set in Vercel env vars

export async function sendNotify(message: string, opts: NtfyOptions = {}): Promise<boolean> {
  if (!TOPIC) {
    // Silently skip — NTFY_TOPIC not configured in Vercel
    console.warn('[JARVIS notify] NTFY_TOPIC not set in env vars. Add it in Vercel dashboard.');
    return false;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'text/plain; charset=utf-8',
    };
    if (opts.title)    headers['Title']    = opts.title;
    if (opts.priority) headers['Priority'] = String(opts.priority);
    if (opts.tags)     headers['Tags']     = opts.tags.join(',');
    if (opts.clickUrl) headers['Click']    = opts.clickUrl;

    // Action buttons (ntfy supports these)
    if (opts.actions?.length) {
      headers['Actions'] = opts.actions
        .map(a => `view, ${a.label}, ${a.url}`)
        .join('; ');
    }

    const r = await fetch(`${SERVER}/${TOPIC}`, {
      method: 'POST',
      headers,
      body: message,
      signal: AbortSignal.timeout(5000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// ── Pre-built notification templates ────────────────────────
export const notify = {
  battery: (pct: number) => sendNotify(
    `Battery ${pct}% — Charger lagao Bhai! 🔌`,
    { title: '🔋 JARVIS Battery Alert', priority: pct < 10 ? 5 : 4, tags: ['battery', 'warning'] }
  ),

  morning: (weather: string, btc: string) => sendNotify(
    `${weather}\n₿ BTC: ${btc}\n\nAaj ka din badhiya rahega! 💪`,
    {
      title: '🌅 JARVIS Morning Briefing',
      priority: 3,
      tags: ['sunrise'],
      clickUrl: 'https://apple10.vercel.app',
      actions: [{ label: '💬 Open JARVIS', url: 'https://apple10.vercel.app' }],
    }
  ),

  reminder: (task: string) => sendNotify(
    task,
    { title: '⏰ JARVIS Reminder', priority: 4, tags: ['alarm_clock'] }
  ),

  aiResponse: (text: string) => sendNotify(
    text.slice(0, 500),
    {
      title: '🤖 JARVIS',
      priority: 2,
      tags: ['robot'],
      clickUrl: 'https://apple10.vercel.app',
    }
  ),

  deviceEvent: (event: string, value: string) => {
    const map: Record<string, { msg: string; tags: string[]; priority: NtfyOptions['priority'] }> = {
      battery_low:      { msg: `Battery ${value}% — Charger lagao!`, tags: ['battery', 'sos'], priority: 5 },
      wifi_connected:   { msg: `WiFi connected: ${value}`, tags: ['signal_strength'], priority: 1 },
      location_home:    { msg: 'Ghar aa gaye! JARVIS ready.', tags: ['house'], priority: 2 },
      charging_started: { msg: `Charging: ${value}%`, tags: ['electric_plug'], priority: 1 },
      call_ended:       { msg: `Call ended (${value}s)`, tags: ['phone'], priority: 2 },
    };
    const m = map[event] || { msg: `${event}: ${value}`, tags: ['bell'], priority: 2 };
    return sendNotify(m.msg, { title: '📱 JARVIS Device', ...m });
  },
};
