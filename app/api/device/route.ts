// ══════════════════════════════════════════════════════════════
// JARVIS DEVICE BRIDGE v2 — MacroDroid → JARVIS (2-way)
//
// MacroDroid sends events here, JARVIS processes + notifies.
//
// Supported event types:
//   battery_low, battery_full, charging_start, charging_stop
//   wifi_connected, wifi_disconnected
//   location_home, location_left, location_arrived
//   screen_on, screen_off
//   headphones_in, headphones_out
//   call_started, call_ended, missed_call
//   sms_received
//   app_opened (which app)
//   volume_changed
//   custom (any event you want)
//
// MacroDroid setup (per event):
//   Trigger: [any trigger you want]
//   Action: HTTP POST → https://apple10.vercel.app/api/device
//   Header: x-jarvis-secret: jarvis2026
//   Body: {"type":"battery_low","value":"[bat]"}
// ══════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { notify } from '@/lib/notify';

export const runtime = 'edge';

// ── Smart response config per event ──────────────────────────
const EVENT_CONFIG: Record<string, {
  msg: (v: string) => string;
  title: string;
  tags: string[];
  priority: 1 | 2 | 3 | 4 | 5;
  smart?: (v: string) => string | null;  // extra smart action
}> = {
  battery_low: {
    msg: v => `Battery ${v}% — Charger lagao Bhai! ⚡`,
    title: '🔋 Low Battery',
    tags: ['battery', 'warning'],
    priority: parseInt(String(0)) < 10 ? 5 : 4 as 4,
  },
  battery_critical: {
    msg: v => `Battery CRITICAL ${v}% — Abhi lagao charger! 🚨`,
    title: '🚨 Critical Battery',
    tags: ['battery', 'sos'],
    priority: 5,
  },
  battery_full: {
    msg: v => `Battery 100% — Charger nikaal lo Bhai 🔋`,
    title: '✅ Battery Full',
    tags: ['battery', 'white_check_mark'],
    priority: 2,
  },
  charging_start: {
    msg: v => `Charging shuru ${v}% se ⚡`,
    title: '⚡ Charging',
    tags: ['electric_plug'],
    priority: 1,
  },
  charging_stop: {
    msg: v => `Charging ruk gayi — ${v}% hai abhi`,
    title: '🔌 Unplugged',
    tags: ['electric_plug'],
    priority: 1,
  },
  wifi_connected: {
    msg: v => `WiFi connected: ${v} 📶`,
    title: '📶 WiFi',
    tags: ['signal_strength'],
    priority: 1,
  },
  wifi_disconnected: {
    msg: v => `WiFi disconnect ho gayi`,
    title: '📵 WiFi Off',
    tags: ['no_entry'],
    priority: 2,
  },
  location_home: {
    msg: v => `Ghar aa gaye! JARVIS ready hai 🏠`,
    title: '🏠 Ghar',
    tags: ['house'],
    priority: 2,
    smart: () => 'home_mode',
  },
  location_left: {
    msg: v => `Ghar se nikle — ${v}`,
    title: '🚶 Nikle',
    tags: ['walking'],
    priority: 1,
  },
  location_arrived: {
    msg: v => `Pahunch gaye: ${v} 📍`,
    title: '📍 Arrived',
    tags: ['round_pushpin'],
    priority: 2,
  },
  screen_on: {
    msg: v => '',  // silent — too frequent
    title: '',
    tags: [],
    priority: 1,
  },
  screen_off: {
    msg: v => '',  // silent
    title: '',
    tags: [],
    priority: 1,
  },
  headphones_in: {
    msg: v => `Headphones laga li 🎧`,
    title: '🎧 Headphones',
    tags: ['headphones'],
    priority: 1,
  },
  call_ended: {
    msg: v => `Call khatam — ${v} seconds 📞`,
    title: '📞 Call Ended',
    tags: ['phone'],
    priority: 2,
  },
  missed_call: {
    msg: v => `Missed call from ${v} 📱`,
    title: '📱 Missed Call',
    tags: ['telephone_receiver', 'warning'],
    priority: 4,
  },
  sms_received: {
    msg: v => `New SMS: ${v.slice(0, 100)} 💬`,
    title: '💬 SMS',
    tags: ['speech_balloon'],
    priority: 3,
  },
  app_opened: {
    msg: v => `${v} khola`,
    title: '📱 App',
    tags: ['iphone'],
    priority: 1,
  },
  volume_changed: {
    msg: v => `Volume: ${v}%`,
    title: '🔊 Volume',
    tags: ['loudspeaker'],
    priority: 1,
  },
};

export async function POST(req: NextRequest) {
  // Auth check
  const secret = req.headers.get('x-jarvis-secret') || '';
  const expected = process.env.MACRODROID_SECRET || 'jarvis2026';
  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { type, value = '', device = 'phone', extra = {} } = body;

  // Log for debugging
  console.log(`[JARVIS Device] ${type}: ${value}`);

  const config = EVENT_CONFIG[type];

  // Send notification (skip silent events)
  if (config && config.msg(value)) {
    await notify.deviceEvent(type, value);
  }

  // Smart actions
  let action = '';
  if (type === 'battery_low' && parseInt(value) < 10) action = 'battery_critical';
  if (type === 'battery_critical') action = 'battery_critical';
  if (config?.smart) action = config.smart(value) || action;

  // Special: SMS — store for AI context (future use)
  if (type === 'sms_received') {
    // Could store to KV for AI to read later
    action = 'sms_stored';
  }

  return NextResponse.json({
    ok: true,
    received: type,
    value,
    action: action || undefined,
    ts: Date.now(),
  });
}

// GET — health check
export async function GET() {
  const topic = process.env.NTFY_TOPIC || '';
  const secret = process.env.MACRODROID_SECRET || 'jarvis2026 (default)';
  return NextResponse.json({
    status: '✅ JARVIS Device Bridge v2 Active',
    events_supported: Object.keys(EVENT_CONFIG).length,
    ntfy: topic ? `ntfy.sh/${topic}` : '⚠️ NOT CONFIGURED — add NTFY_TOPIC in Vercel',
    macrodroid_secret: secret.slice(0, 4) + '****',
    endpoint: 'POST https://apple10.vercel.app/api/device',
    header: 'x-jarvis-secret: jarvis2026',
    body_example: '{"type":"battery_low","value":"15"}',
    ts: new Date().toISOString(),
  });
}
