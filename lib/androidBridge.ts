'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS ANDROID BRIDGE v3
// MacroDroid Webhook — Direct URL (no ntfy needed for commands)
//
// URL: https://trigger.macrodroid.com/{DEVICE_ID}/{action}?value={val}
//
// MacroDroid mein sirf ek "Master Macro" banao:
//   Trigger: Webhook (Generic)
//   Conditions: none
//   Actions: If/Else on {action} variable
// ══════════════════════════════════════════════════════════════

export type AndroidAction =
  | 'wifi_on' | 'wifi_off'
  | 'bluetooth_on' | 'bluetooth_off'
  | 'data_on' | 'data_off'
  | 'hotspot_on' | 'hotspot_off'
  | 'torch_on' | 'torch_off' | 'torch_toggle'
  | 'volume_set' | 'volume_mute' | 'volume_max'
  | 'brightness_set' | 'brightness_auto'
  | 'silent_on' | 'vibrate_on' | 'sound_on'
  | 'screenshot' | 'lock_screen'
  | 'find_phone' | 'gps_location'
  | 'open_app'
  | 'media_play' | 'media_pause' | 'media_next'
  | 'dnd_on' | 'dnd_off'
  | 'airplane_on' | 'airplane_off'
  | 'reboot'
  | 'custom';

export interface AndroidCommand {
  action: AndroidAction;
  value?: string | number;
  params?: Record<string, string | number | boolean>;
}

export interface BridgeResult {
  ok: boolean;
  result?: string;
  error?: string;
}

// ── MacroDroid Webhook Device ID ─────────────────────────────
const DEVICE_ID = process.env.NEXT_PUBLIC_MACRODROID_DEVICE_ID
  || '8f39b647-8597-4a62-94fc-20f48fe0d14e';

const WEBHOOK_BASE = `https://trigger.macrodroid.com/${DEVICE_ID}`;

export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

// ── Send via MacroDroid Webhook (direct, no ntfy) ─────────────
export async function sendAndroidCommand(cmd: AndroidCommand): Promise<BridgeResult> {
  // Direct deep links for call/sms/url (no MacroDroid needed)
  const directLink = getDirectLink(cmd);
  if (directLink && typeof window !== 'undefined') {
    window.location.href = directLink;
    return { ok: true, result: `Opened: ${cmd.action}` };
  }

  // MacroDroid Webhook
  try {
    const val = cmd.value !== undefined ? String(cmd.value) : '';
    const url = `${WEBHOOK_BASE}/${cmd.action}${val ? `?value=${encodeURIComponent(val)}` : ''}`;

    // no-cors because MacroDroid webhook doesn't set CORS headers
    await fetch(url, { method: 'GET', mode: 'no-cors', signal: AbortSignal.timeout(6000) });
    return { ok: true, result: `✅ ${cmd.action} executed` };
  } catch (e: any) {
    if (e.name === 'AbortError') return { ok: false, error: 'MacroDroid timeout — phone on hai?' };
    return { ok: false, error: 'MacroDroid webhook nahi pahuncha' };
  }
}

function getDirectLink(cmd: AndroidCommand): string | null {
  switch (cmd.action) {
    case 'open_app': {
      const pkgMap: Record<string, string> = {
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
      };
      const pkg = pkgMap[String(cmd.value || '').toLowerCase()];
      return pkg ? `intent://launch#Intent;package=${pkg};end` : null;
    }
    default: return null;
  }
}

// ── Natural language → AndroidCommand ────────────────────────
export function parseAndroidIntent(text: string): AndroidCommand | null {
  const t = text.toLowerCase();

  // WiFi
  if (t.match(/wifi\s*(on|chalu|lagao)/i))     return { action: 'wifi_on' };
  if (t.match(/wifi\s*(off|band|hatao)/i))     return { action: 'wifi_off' };

  // Bluetooth
  if (t.match(/bluetooth\s*(on|chalu)/i))      return { action: 'bluetooth_on' };
  if (t.match(/bluetooth\s*(off|band)/i))      return { action: 'bluetooth_off' };

  // Mobile Data
  if (t.match(/data\s*(on|chalu)|internet on/i))  return { action: 'data_on' };
  if (t.match(/data\s*(off|band)|internet off/i)) return { action: 'data_off' };

  // Hotspot
  if (t.match(/hotspot\s*(on|chalu|lagao)/i))  return { action: 'hotspot_on' };
  if (t.match(/hotspot\s*(off|band|hatao)/i))  return { action: 'hotspot_off' };

  // Torch / Flashlight
  if (t.match(/torch|flashlight|light|torchlight/) && t.match(/off|band/)) return { action: 'torch_off' };
  if (t.match(/torch|flashlight|light|torchlight/) && !t.match(/off|band/)) return { action: 'torch_on' };
  if (t.match(/torch.*toggle|flash.*toggle/i))  return { action: 'torch_toggle' };

  // Volume
  if (t.match(/volume.*mute|mute.*karo|awaaz\s*band/i)) return { action: 'volume_mute' };
  if (t.match(/volume.*max|poori\s*awaaz|full\s*volume/i)) return { action: 'volume_max' };
  const volMatch = t.match(/volume\s*(\d+)/i);
  if (volMatch) return { action: 'volume_set', value: volMatch[1] };

  // Brightness
  if (t.match(/brightness.*auto|auto.*brightness/i)) return { action: 'brightness_auto' };
  const brightMatch = t.match(/brightness\s*(\d+)/i);
  if (brightMatch) return { action: 'brightness_set', value: brightMatch[1] };

  // Sound mode
  if (t.match(/silent|mute.*phone|phone.*silent/i))    return { action: 'silent_on' };
  if (t.match(/vibrate\s*mode|vibration\s*on/i))       return { action: 'vibrate_on' };
  if (t.match(/sound.*on|ringer.*on|awaaz.*chalu/i))   return { action: 'sound_on' };

  // DND
  if (t.match(/do not disturb|dnd on/i))   return { action: 'dnd_on' };
  if (t.match(/dnd off|disturb.*off/i))    return { action: 'dnd_off' };

  // Airplane
  if (t.match(/airplane.*on|flight.*mode.*on/i))  return { action: 'airplane_on' };
  if (t.match(/airplane.*off|flight.*mode.*off/i)) return { action: 'airplane_off' };

  // Screenshot
  if (t.match(/screenshot|screen\s*capture/i))     return { action: 'screenshot' };

  // Lock
  if (t.match(/lock\s*(screen|phone|karo)|phone.*lock/i)) return { action: 'lock_screen' };

  // Find phone / sound alarm
  if (t.match(/find.*phone|phone.*kahan|phone.*dhundho|loud.*sound|baja\s*do/i)) return { action: 'find_phone' };

  // GPS location
  if (t.match(/gps|location|meri.*jagah|main\s*kahan\s*hoon|where.*am.*i/i)) return { action: 'gps_location' };

  // Media
  if (t.match(/pause\s*(music|song|gaana|video)/i))   return { action: 'media_pause' };
  if (t.match(/play\s*(music|song|gaana)|resume/i))   return { action: 'media_play' };
  if (t.match(/next\s*(song|track|gaana)/i))           return { action: 'media_next' };

  // Open app
  const appNames = ['youtube','whatsapp','instagram','maps','camera','settings','chrome','spotify','telegram','gmail','zomato','swiggy','gpay','phonepe','netflix','amazon'];
  for (const app of appNames) {
    if (t.includes(app) && t.match(/open|kholo|chala|launch/)) {
      return { action: 'open_app', value: app };
    }
  }

  // Reboot (dangerous — only if explicitly said)
  if (t.match(/reboot|restart\s*phone|phone\s*restart/i)) return { action: 'reboot' };

  return null;
}

// ── Human-readable action response ────────────────────────────
export function actionToHuman(action: AndroidAction, value?: string | number): string {
  const map: Partial<Record<AndroidAction, string>> = {
    wifi_on: '📶 WiFi chalu ho gayi!',
    wifi_off: '📵 WiFi band ho gayi!',
    bluetooth_on: '🔵 Bluetooth on ho gaya!',
    bluetooth_off: '🔵 Bluetooth off ho gaya!',
    data_on: '📡 Mobile data on ho gayi!',
    data_off: '📡 Mobile data off ho gayi!',
    hotspot_on: '📲 Hotspot on ho gaya!',
    hotspot_off: '📲 Hotspot off ho gaya!',
    torch_on: '🔦 Flashlight on!',
    torch_off: '🔦 Flashlight off!',
    torch_toggle: '🔦 Flashlight toggle!',
    volume_mute: '🔇 Phone mute ho gaya!',
    volume_max: '🔊 Volume max kar di!',
    volume_set: `🔊 Volume ${value}% set ho gaya!`,
    brightness_set: `☀️ Brightness ${value}% ho gayi!`,
    brightness_auto: '☀️ Auto brightness on!',
    silent_on: '🔕 Phone silent ho gaya!',
    vibrate_on: '📳 Vibrate mode on!',
    sound_on: '🔔 Sound on ho gaya!',
    dnd_on: '🌙 Do Not Disturb on!',
    dnd_off: '🌙 DND off ho gaya!',
    screenshot: '📸 Screenshot le raha hoon!',
    lock_screen: '🔒 Screen lock ho rahi hai!',
    find_phone: '📢 Phone pe loud alarm baj raha hai!',
    gps_location: '📍 GPS location fetch kar raha hoon...',
    media_pause: '⏸️ Music pause ho gaya!',
    media_play: '▶️ Music play ho rahi hai!',
    media_next: '⏭️ Next track!',
    airplane_on: '✈️ Airplane mode on!',
    airplane_off: '✈️ Airplane mode off!',
    reboot: '🔄 Phone restart ho raha hai...',
  };
  return map[action] || `✅ ${action} done!`;
}

export const MACRODROID_SETUP = `
📱 **MacroDroid Master Macro Setup:**

Device ID: \`8f39b647-8597-4a62-94fc-20f48fe0d14e\`

1. MacroDroid install karo (free)
2. "Master Macro" import karo (JARVIS se milega)
3. Webhook trigger automatically kaam karega

apple10.vercel.app/macrodroid
`;
