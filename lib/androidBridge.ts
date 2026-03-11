// ══════════════════════════════════════════════════════════════
// ANDROID BRIDGE — JARVIS ↔ MacroDroid / Native Android
// ══════════════════════════════════════════════════════════════
// How it works:
// 1. JARVIS detects automation intent in chat
// 2. Calls MacroDroid's local HTTP server (localhost:7777)
// 3. MacroDroid executes the action on device
// 4. Result comes back to JARVIS chat
//
// MacroDroid Setup:
//   Add trigger: "HTTP Server" on port 7777
//   Add actions per endpoint (WiFi, call, open app, etc.)
// ══════════════════════════════════════════════════════════════
'use client';

export type AndroidAction =
  | 'open_app'
  | 'toggle_wifi'
  | 'toggle_bluetooth'
  | 'toggle_flashlight'
  | 'make_call'
  | 'send_sms'
  | 'set_volume'
  | 'set_brightness'
  | 'set_alarm'
  | 'take_screenshot'
  | 'lock_screen'
  | 'launch_url'
  | 'send_notification'
  | 'read_battery'
  | 'custom';

export interface AndroidCommand {
  action: AndroidAction;
  params?: Record<string, string | number | boolean>;
}

export interface BridgeResult {
  ok: boolean;
  result?: string;
  error?: string;
}

// ── MacroDroid local server (default port 7777) ──────────────
const BRIDGE_PORT = 7777;
const BRIDGE_URL  = `http://localhost:${BRIDGE_PORT}`;

// ── Check if running inside TWA/Android ──────────────────────
export function isAndroidTWA(): boolean {
  if (typeof window === 'undefined') return false;
  // TWA sets a specific referrer or URL param
  const ua = navigator.userAgent.toLowerCase();
  const isTWA = window.matchMedia('(display-mode: standalone)').matches
    && ua.includes('android')
    && !ua.includes('mobile safari');
  // Also check for our custom TWA marker
  const params = new URLSearchParams(window.location.search);
  return isTWA || params.get('source') === 'twa';
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

// ── Send command to MacroDroid ────────────────────────────────
export async function sendAndroidCommand(cmd: AndroidCommand): Promise<BridgeResult> {
  if (!isAndroid()) {
    return { ok: false, error: 'Not on Android device' };
  }

  // Map action to MacroDroid endpoint
  const endpoint = actionToEndpoint(cmd.action);
  const params = new URLSearchParams();
  if (cmd.params) {
    Object.entries(cmd.params).forEach(([k, v]) => params.set(k, String(v)));
  }

  try {
    const url = `${BRIDGE_URL}/${endpoint}${cmd.params ? '?' + params.toString() : ''}`;
    const r = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
      mode: 'no-cors', // MacroDroid local server
    });
    return { ok: true, result: 'Command sent to MacroDroid' };
  } catch (e: any) {
    // If MacroDroid not running — fallback to deep links
    const fallback = getFallback(cmd);
    if (fallback) {
      window.location.href = fallback;
      return { ok: true, result: 'Opened via deep link' };
    }
    return { ok: false, error: 'MacroDroid not reachable. Install and enable HTTP Server trigger.' };
  }
}

function actionToEndpoint(action: AndroidAction): string {
  const map: Record<AndroidAction, string> = {
    open_app:          'open_app',
    toggle_wifi:       'wifi',
    toggle_bluetooth:  'bluetooth',
    toggle_flashlight: 'flashlight',
    make_call:         'call',
    send_sms:          'sms',
    set_volume:        'volume',
    set_brightness:    'brightness',
    set_alarm:         'alarm',
    take_screenshot:   'screenshot',
    lock_screen:       'lock',
    launch_url:        'url',
    send_notification: 'notify',
    read_battery:      'battery',
    custom:            'custom',
  };
  return map[action] || 'custom';
}

// Deep link fallbacks when MacroDroid not running
function getFallback(cmd: AndroidCommand): string | null {
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
    default:
      return null;
  }
}

// ── Natural language → Android command parser ─────────────────
export function parseAndroidIntent(text: string): AndroidCommand | null {
  const t = text.toLowerCase();

  // WiFi
  if (t.match(/wifi (on|off|chalu|band)/i)) {
    const on = t.match(/on|chalu/) ? true : false;
    return { action: 'toggle_wifi', params: { state: on ? 'on' : 'off' } };
  }
  // Bluetooth
  if (t.match(/bluetooth (on|off|chalu|band)/i)) {
    return { action: 'toggle_bluetooth', params: { state: t.includes('on') || t.includes('chalu') ? 'on' : 'off' } };
  }
  // Torch / Flashlight
  if (t.match(/torch|flashlight|torch (on|off)|light (on|off)/i)) {
    return { action: 'toggle_flashlight', params: { state: t.includes('off') || t.includes('band') ? 'off' : 'on' } };
  }
  // Call
  const callMatch = t.match(/call\s+([\d\s+\-]+)/i);
  if (callMatch) {
    return { action: 'make_call', params: { number: callMatch[1].replace(/\s/g, '') } };
  }
  // Open app
  const openMatch = t.match(/open\s+(\w+)|(\w+)\s+kholo/i);
  if (openMatch) {
    const appName = (openMatch[1] || openMatch[2]).toLowerCase();
    const pkgMap: Record<string, string> = {
      youtube:  'com.google.android.youtube',
      whatsapp: 'com.whatsapp',
      maps:     'com.google.android.apps.maps',
      camera:   'com.android.camera2',
      settings: 'com.android.settings',
      chrome:   'com.android.chrome',
      spotify:  'com.spotify.music',
    };
    return { action: 'open_app', params: { package: pkgMap[appName] || appName, name: appName } };
  }
  // Volume
  const volMatch = t.match(/volume\s+(\d+)/i);
  if (volMatch) {
    return { action: 'set_volume', params: { level: parseInt(volMatch[1]) } };
  }
  // Alarm
  const alarmMatch = t.match(/alarm\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (alarmMatch) {
    let hour = parseInt(alarmMatch[1]);
    const min = parseInt(alarmMatch[2] || '0');
    if (alarmMatch[3]?.toLowerCase() === 'pm' && hour < 12) hour += 12;
    return { action: 'set_alarm', params: { hour, minute: min } };
  }
  // Screenshot
  if (t.match(/screenshot|screen capture/i)) {
    return { action: 'take_screenshot' };
  }
  // Lock
  if (t.match(/lock (screen|phone)|phone lock/i)) {
    return { action: 'lock_screen' };
  }
  // Battery
  if (t.match(/battery|charge/i)) {
    return { action: 'read_battery' };
  }

  return null;
}

// ── MacroDroid setup guide ────────────────────────────────────
export const MACRODROID_SETUP = `
📱 **MacroDroid Setup Guide:**

1. Install MacroDroid from Play Store (free)
2. Create a new Macro
3. **Trigger:** Add Trigger → "HTTP Server" → Port 7777
4. **Action:** Add Action based on endpoint:

| JARVIS Command | MacroDroid Action | URL |
|---|---|---|
| WiFi on/off | Toggle WiFi | /wifi?state=on |
| Torch on | Toggle Flashlight | /flashlight?state=on |
| Open YouTube | Launch App | /open_app?package=com.google.android.youtube |
| Call 9876 | Phone Call | /call?number=9876 |
| Volume 50 | Set Volume | /volume?level=50 |
| Screenshot | Take Screenshot | /screenshot |
| Lock phone | Screen Lock | /lock |

5. Enable the Macro
6. Test: Browser mein jaao → http://localhost:7777/battery

💡 **Tip:** MacroDroid Pro nahi chahiye — free version kaam karta hai!
`;
