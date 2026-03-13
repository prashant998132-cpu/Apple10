'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS TERMUX BRIDGE — Free phone control via ntfy.sh
// User installs: Termux + Termux:API (both free on F-Droid)
// Flow: JARVIS → ntfy.sh → Termux listens → runs command → result back
// ══════════════════════════════════════════════════════════════

const NTFY_TOPIC = 'jarvis-pranshu-2026';
const NTFY_URL = `https://ntfy.sh/${NTFY_TOPIC}`;

export type TermuxAction =
  | 'torch_on' | 'torch_off'
  | 'volume_set' | 'volume_mute' | 'volume_max'
  | 'vibrate'
  | 'battery'
  | 'screenshot'
  | 'location'
  | 'wifi_info'
  | 'sms_send'
  | 'notification'
  | 'tts'
  | 'open_url'
  | 'call'
  | 'media_play' | 'media_pause' | 'media_next'
  | 'brightness_set'
  | 'silent' | 'vibrate_mode' | 'normal_mode';

// Send command to Termux via ntfy
export async function sendTermuxCommand(action: TermuxAction, value?: string): Promise<boolean> {
  try {
    const cmd = buildCommand(action, value);
    if (!cmd) return false;

    await fetch(NTFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'Title': 'jarvis-cmd', 'Priority': 'high' },
      body: cmd,
    });
    return true;
  } catch { return false; }
}

function buildCommand(action: TermuxAction, value?: string): string {
  const v = value || '';
  switch (action) {
    case 'torch_on':       return 'termux-torch on';
    case 'torch_off':      return 'termux-torch off';
    case 'volume_mute':    return 'termux-volume music 0 && termux-volume ring 0';
    case 'volume_max':     return 'termux-volume music 15 && termux-volume ring 15';
    case 'volume_set':     return `termux-volume music ${v} && termux-volume ring ${v}`;
    case 'vibrate':        return `termux-vibrate -d ${v || '500'}`;
    case 'battery':        return 'termux-battery-status | curl -s -d @- https://ntfy.sh/jarvis-pranshu-result -H "Title: battery"';
    case 'screenshot':     return 'termux-screenshot -f /sdcard/jarvis_ss.jpg && termux-toast "Screenshot saved!"';
    case 'location':       return 'termux-location | curl -s -d @- https://ntfy.sh/jarvis-pranshu-result -H "Title: location"';
    case 'wifi_info':      return 'termux-wifi-connectioninfo | curl -s -d @- https://ntfy.sh/jarvis-pranshu-result -H "Title: wifi"';
    case 'notification':   return `termux-notification --title "JARVIS" --content "${v}"`;
    case 'tts':            return `termux-tts-speak "${v}"`;
    case 'open_url':       return `termux-open-url "${v}"`;
    case 'call':           return `termux-telephony-call ${v}`;
    case 'media_play':     return 'termux-media-player play';
    case 'media_pause':    return 'termux-media-player pause';
    case 'media_next':     return 'am broadcast -a com.android.music.musicservicecommand -e command next';
    case 'brightness_set': return `termux-brightness ${v || '128'}`;
    case 'silent':         return 'termux-ringer-volume -1 && termux-notification-volume -1';
    case 'vibrate_mode':   return 'termux-ringer-volume 0';
    case 'normal_mode':    return 'termux-ringer-volume 7';
    default: return '';
  }
}

// Parse natural language → TermuxAction
export function parseTermuxIntent(text: string): { action: TermuxAction; value?: string } | null {
  const t = text.toLowerCase();

  if (t.match(/torch|flash|light jala|torchlight on/)) return { action: 'torch_on' };
  if (t.match(/torch.*off|flash.*off|light.*band|torchlight.*off/)) return { action: 'torch_off' };
  if (t.match(/mute|awaaz band|volume.*zero|silent.*phone/)) return { action: 'volume_mute' };
  if (t.match(/volume.*max|full.*volume|poori.*awaaz/)) return { action: 'volume_max' };

  const volMatch = t.match(/volume\s*(\d+)/);
  if (volMatch) return { action: 'volume_set', value: volMatch[1] };

  const brightMatch = t.match(/brightness\s*(\d+)/);
  if (brightMatch) return { action: 'brightness_set', value: brightMatch[1] };

  if (t.match(/screenshot|screen.*capture|ss le/)) return { action: 'screenshot' };
  if (t.match(/battery.*kitna|battery.*status|charge.*kitna/)) return { action: 'battery' };
  if (t.match(/location|kahan hoon|gps|mera.*location/)) return { action: 'location' };
  if (t.match(/silent.*mode|phone.*silent/)) return { action: 'silent' };
  if (t.match(/vibrate.*mode/)) return { action: 'vibrate_mode' };
  if (t.match(/sound.*on|ringer.*on|normal.*mode/)) return { action: 'normal_mode' };
  if (t.match(/music.*play|gaana.*chala|play.*song/)) return { action: 'media_play' };
  if (t.match(/music.*pause|gaana.*pause|pause.*song/)) return { action: 'media_pause' };
  if (t.match(/next.*song|agle.*gaana/)) return { action: 'media_next' };
  if (t.match(/wifi.*info|wifi.*kya|connected.*wifi/)) return { action: 'wifi_info' };
  if (t.match(/vibrate|hila/)) return { action: 'vibrate' };

  const ttsMatch = t.match(/phone.*bolo\s+(.+)|tts\s+(.+)|speak\s+(.+)/);
  if (ttsMatch) return { action: 'tts', value: ttsMatch[1] || ttsMatch[2] || ttsMatch[3] };

  const callMatch = t.match(/call\s+(\d{10,})/);
  if (callMatch) return { action: 'call', value: callMatch[1] };

  const urlMatch = t.match(/kholo\s+(https?:\/\/\S+)|open\s+(https?:\/\/\S+)/);
  if (urlMatch) return { action: 'open_url', value: urlMatch[1] || urlMatch[2] };

  return null;
}

export function termuxActionToHuman(action: TermuxAction, value?: string): string {
  const map: Record<TermuxAction, string> = {
    torch_on: '🔦 Torch on ho rahi hai!',
    torch_off: '🔦 Torch band ho rahi hai!',
    volume_mute: '🔇 Phone mute ho raha hai!',
    volume_max: '🔊 Volume max ho rahi hai!',
    volume_set: `🔊 Volume ${value} set ho raha hai!`,
    brightness_set: `☀️ Brightness ${value} set ho rahi hai!`,
    vibrate: '📳 Phone vibrate kar raha hai!',
    battery: '🔋 Battery status fetch ho raha hai...',
    screenshot: '📸 Screenshot le raha hai!',
    location: '📍 Location fetch ho raha hai...',
    wifi_info: '📶 WiFi info aa raha hai...',
    sms_send: '💬 SMS bhej raha hai!',
    notification: '🔔 Notification bhej raha hai!',
    tts: `🔊 Phone bol raha hai: "${value}"`,
    open_url: `🌐 ${value} khul raha hai!`,
    call: `📞 ${value} ko call kar raha hai!`,
    media_play: '▶️ Music play ho rahi hai!',
    media_pause: '⏸️ Music pause ho rahi hai!',
    media_next: '⏭️ Next song!',
    silent: '🔕 Silent mode on!',
    vibrate_mode: '📳 Vibrate mode on!',
    normal_mode: '🔔 Normal mode on!',
  };
  return map[action] || '✅ Done!';
}

// Termux setup script (one-time, user runs in Termux)
export const TERMUX_SETUP_SCRIPT = `# Run this ONCE in Termux:
pkg update -y && pkg install termux-api -y
# Then run the listener:
while true; do
  MSG=$(curl -s --max-time 60 "https://ntfy.sh/jarvis-pranshu-2026/raw")
  if [ -n "$MSG" ]; then eval "$MSG"; fi
  sleep 1
done`;
