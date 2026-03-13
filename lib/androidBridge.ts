// ══════════════════════════════════════════════════════════════
// ANDROID BRIDGE v2 — JARVIS ↔ MacroDroid (2-way)
//
// FIXED APPROACH: localhost:7777 HTTPS→HTTP block ki wajah se
// kaam nahi karta tha. Ab ntfy.sh channel use karta hoon:
//
// JARVIS → MacroDroid:
//   JARVIS sends command to ntfy topic "jarvis-cmd-pranshu"
//   MacroDroid subscribes to same ntfy topic (HTTP Shortcut trigger)
//   MacroDroid reads message → executes action
//
// MacroDroid → JARVIS:
//   MacroDroid sends POST to https://apple10.vercel.app/api/device
//   JARVIS processes event → sends user notification via ntfy
// ══════════════════════════════════════════════════════════════
'use client';

export type AndroidAction =
  | 'open_app' | 'toggle_wifi' | 'toggle_bluetooth' | 'toggle_flashlight'
  | 'make_call' | 'send_sms' | 'set_volume' | 'set_brightness'
  | 'set_alarm' | 'take_screenshot' | 'lock_screen' | 'launch_url'
  | 'send_notification' | 'read_battery' | 'media_play' | 'media_pause'
  | 'media_next' | 'do_not_disturb' | 'airplane_mode' | 'custom';

export interface AndroidCommand {
  action: AndroidAction;
  params?: Record<string, string | number | boolean>;
}

export interface BridgeResult {
  ok: boolean;
  result?: string;
  error?: string;
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

// ── JARVIS → MacroDroid via ntfy.sh command channel ──────────
// MacroDroid mein ek macro banao:
//   Trigger: "Receive HTTP" on URL polling OR ntfy app + Tasker plugin
//   OR simpler: MacroDroid "HTTP Shortcut" action trigger on ntfy webhook
async function sendViaNtfy(cmd: AndroidCommand): Promise<BridgeResult> {
  const topic = process.env.NEXT_PUBLIC_NTFY_CMD_TOPIC
    || (typeof window !== 'undefined' && (window as any).__JARVIS_CMD_TOPIC)
    || 'jarvis-cmd-pranshu';  // MacroDroid subscribe karega isi topic pe

  const cmdStr = JSON.stringify({
    action: cmd.action,
    params: cmd.params || {},
    ts: Date.now(),
  });

  try {
    const r = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Title': `JARVIS-CMD:${cmd.action}`,
        'Priority': '4',
        'Tags': 'robot',
      },
      body: cmdStr,
    });
    if (r.ok) return { ok: true, result: `Command sent: ${cmd.action}` };
    return { ok: false, error: 'ntfy send failed' };
  } catch {
    return { ok: false, error: 'Network error sending command' };
  }
}

// ── Deep link fallbacks (always work, no MacroDroid needed) ──
function deepLinkFallback(cmd: AndroidCommand): string | null {
  switch (cmd.action) {
    case 'make_call':
      return `tel:${cmd.params?.number || ''}`;
    case 'send_sms':
      return `sms:${cmd.params?.number || ''}?body=${encodeURIComponent(String(cmd.params?.message || ''))}`;
    case 'launch_url':
      return String(cmd.params?.url || '');
    case 'set_alarm': {
      const h = cmd.params?.hour || 7, m = cmd.params?.minute || 0;
      return `intent://alarm#Intent;action=android.intent.action.SET_ALARM;i.HOUR=${h};i.MINUTES=${m};end`;
    }
    case 'open_app': {
      const pkg = cmd.params?.package;
      return pkg ? `intent://launch#Intent;package=${pkg};end` : null;
    }
    case 'toggle_wifi':
      return 'intent://settings#Intent;action=android.settings.WIFI_SETTINGS;end';
    case 'toggle_bluetooth':
      return 'intent://settings#Intent;action=android.settings.BLUETOOTH_SETTINGS;end';
    case 'launch_url':
      return String(cmd.params?.url || '');
    default:
      return null;
  }
}

// ── Main: send command (ntfy first, deep link fallback) ───────
export async function sendAndroidCommand(cmd: AndroidCommand): Promise<BridgeResult> {
  if (!isAndroid()) {
    return { ok: false, error: 'Not on Android device' };
  }

  // Call/SMS/URL — direct deep link is faster + more reliable
  const directActions: AndroidAction[] = ['make_call', 'send_sms', 'launch_url', 'set_alarm'];
  if (directActions.includes(cmd.action)) {
    const link = deepLinkFallback(cmd);
    if (link && typeof window !== 'undefined') {
      window.location.href = link;
      return { ok: true, result: 'Opened via Android deep link' };
    }
  }

  // Everything else → ntfy command channel → MacroDroid
  const result = await sendViaNtfy(cmd);
  if (!result.ok) {
    // Last resort: deep link
    const link = deepLinkFallback(cmd);
    if (link && typeof window !== 'undefined') {
      window.location.href = link;
      return { ok: true, result: 'Fallback: opened via deep link' };
    }
  }
  return result;
}

// ── Natural language → Android command parser ─────────────────
export function parseAndroidIntent(text: string): AndroidCommand | null {
  const t = text.toLowerCase();

  // WiFi
  if (t.match(/wifi\s*(on|off|chalu|band)/i))
    return { action: 'toggle_wifi', params: { state: t.match(/on|chalu/) ? 'on' : 'off' } };

  // Bluetooth
  if (t.match(/bluetooth\s*(on|off|chalu|band)/i))
    return { action: 'toggle_bluetooth', params: { state: t.match(/on|chalu/) ? 'on' : 'off' } };

  // Torch / Flashlight
  if (t.match(/torch|flashlight|light\s*(on|off)|torchlight/i))
    return { action: 'toggle_flashlight', params: { state: t.match(/off|band/) ? 'off' : 'on' } };

  // Screenshot
  if (t.match(/screenshot|screen capture|screengrab/i))
    return { action: 'take_screenshot' };

  // Lock screen
  if (t.match(/lock\s*(screen|phone|kar)|phone\s*lock/i))
    return { action: 'lock_screen' };

  // DND
  if (t.match(/do not disturb|dnd|silent mode|mute phone/i))
    return { action: 'do_not_disturb', params: { state: t.match(/off|hatao/) ? 'off' : 'on' } };

  // Media controls
  if (t.match(/pause\s*(music|song|gaana|video)/i)) return { action: 'media_pause' };
  if (t.match(/play\s*(music|song|gaana|video)|resume/i)) return { action: 'media_play' };
  if (t.match(/next\s*(song|track|gaana)/i)) return { action: 'media_next' };

  // Volume
  const volMatch = t.match(/volume\s*(\d+)/i);
  if (volMatch) return { action: 'set_volume', params: { level: parseInt(volMatch[1]) } };

  // Brightness
  const brightMatch = t.match(/brightness\s*(\d+)/i);
  if (brightMatch) return { action: 'set_brightness', params: { level: parseInt(brightMatch[1]) } };

  // Call
  const callMatch = t.match(/(?:call|ring)\s+([\d\s+\-]+)/i);
  if (callMatch) return { action: 'make_call', params: { number: callMatch[1].replace(/\s/g, '') } };

  // SMS
  const smsMatch = t.match(/(?:message|sms|text)\s+([\d\s+]+)(?:\s+(.+))?/i);
  if (smsMatch) return { action: 'send_sms', params: { number: smsMatch[1].trim(), message: smsMatch[2] || '' } };

  // Alarm
  const alarmMatch = t.match(/alarm\s+(\d{1,2}):?(\d{2})?\s*(am|pm|baje)?/i);
  if (alarmMatch) {
    let hour = parseInt(alarmMatch[1]);
    const min = parseInt(alarmMatch[2] || '0');
    if (alarmMatch[3]?.toLowerCase() === 'pm' && hour < 12) hour += 12;
    return { action: 'set_alarm', params: { hour, minute: min } };
  }

  // Open specific apps
  const appMap: Record<string, string> = {
    youtube: 'com.google.android.youtube',
    whatsapp: 'com.whatsapp',
    instagram: 'com.instagram.android',
    maps: 'com.google.android.apps.maps',
    camera: 'com.android.camera2',
    settings: 'com.android.settings',
    chrome: 'com.android.chrome',
    spotify: 'com.spotify.music',
    telegram: 'org.telegram.messenger',
    gmail: 'com.google.android.gm',
    zomato: 'com.application.zomato',
    swiggy: 'in.swiggy.android',
    gpay: 'com.google.android.apps.nbu.paisa.user',
    phonepe: 'com.phonepe.app',
    netflix: 'com.netflix.mediaclient',
    amazon: 'in.amazon.mShop.android.shopping',
  };
  const openMatch = t.match(/open\s+(\w+)|(\w+)\s+(?:kholo|open karo|chalao)/i);
  if (openMatch) {
    const appName = (openMatch[1] || openMatch[2]).toLowerCase();
    const pkg = appMap[appName];
    if (pkg) return { action: 'open_app', params: { package: pkg, name: appName } };
  }

  // Battery check
  if (t.match(/battery\s*(kitna|kitni|percent|status|check)/i))
    return { action: 'read_battery' };

  return null;
}

// ── MacroDroid setup instructions ────────────────────────────
export const MACRODROID_SETUP = `
📱 **MacroDroid Setup (2-way JARVIS bridge):**

**Step 1 — Install**
Play Store → MacroDroid (free)
Play Store → ntfy (free)

**Step 2 — MacroDroid → JARVIS (device events)**
New Macro → Trigger: Battery Level (below 20%)
Action: HTTP POST → \`https://apple10.vercel.app/api/device\`
Header: \`x-jarvis-secret: jarvis2026\`
Body: \`{"type":"battery_low","value":"[bat]"}\`

**Step 3 — JARVIS → MacroDroid (commands)**
New Macro → Trigger: ntfy topic subscribe
Topic: \`jarvis-cmd-pranshu\`
Action: Parse JSON → Execute based on "action" field

Full guide: apple10.vercel.app/macrodroid-setup
`;
