// ══════════════════════════════════════════════════════════════
// JARVIS Voice Command Engine v1
// Handles: deep links, app control, tool triggers, wake word
// ══════════════════════════════════════════════════════════════

export type CommandType = 'deeplink' | 'appcontrol' | 'tool' | 'none';

export interface CommandResult {
  type: CommandType;
  action: string;
  payload?: any;
  spoken?: string; // JARVIS bolega yeh
}

// ── Deep Links (Android apps) ──────────────────────────────────
const DEEP_LINKS: { pattern: RegExp; url: string; name: string }[] = [
  { pattern: /youtube\s*(khol|open|chalu|play|start)/i, url: 'intent://www.youtube.com/#Intent;scheme=https;package=com.google.android.youtube;end', name: 'YouTube' },
  { pattern: /whatsapp\s*(khol|open|chalu)/i,           url: 'intent://send#Intent;scheme=whatsapp;package=com.whatsapp;end', name: 'WhatsApp' },
  { pattern: /instagram\s*(khol|open|chalu)/i,          url: 'intent://instagram.com/#Intent;scheme=https;package=com.instagram.android;end', name: 'Instagram' },
  { pattern: /zomato\s*(khol|open|chalu)/i,             url: 'intent://zomato.com/#Intent;scheme=https;package=com.application.zomato;end', name: 'Zomato' },
  { pattern: /swiggy\s*(khol|open|chalu)/i,             url: 'intent://swiggy.com/#Intent;scheme=https;package=in.swiggy.android;end', name: 'Swiggy' },
  { pattern: /(gpay|google\s*pay)\s*(khol|open)/i,      url: 'intent://pay.google.com/#Intent;scheme=https;package=com.google.android.apps.nbu.paisa.user;end', name: 'Google Pay' },
  { pattern: /phonepe\s*(khol|open)/i,                  url: 'intent://phonepe.com/#Intent;scheme=https;package=com.phonepe.app;end', name: 'PhonePe' },
  { pattern: /camera\s*(khol|open|chalu)/i,             url: 'intent://camera/#Intent;action=android.media.action.STILL_IMAGE_CAMERA;end', name: 'Camera' },
  { pattern: /(google\s*maps?|maps?)\s*(khol|open)/i,   url: 'intent://maps.google.com/#Intent;scheme=https;package=com.google.android.apps.maps;end', name: 'Maps' },
  { pattern: /chrome\s*(khol|open)/i,                   url: 'intent://www.google.com/#Intent;scheme=https;package=com.android.chrome;end', name: 'Chrome' },
  { pattern: /spotify\s*(khol|open|chalu|play)/i,       url: 'intent://spotify.com/#Intent;scheme=https;package=com.spotify.music;end', name: 'Spotify' },
  { pattern: /telegram\s*(khol|open)/i,                 url: 'intent://telegram.me/#Intent;scheme=https;package=org.telegram.messenger;end', name: 'Telegram' },
  { pattern: /gmail\s*(khol|open)/i,                    url: 'intent://gmail.com/#Intent;scheme=https;package=com.google.android.gm;end', name: 'Gmail' },
  { pattern: /settings\s*(khol|open)/i,                 url: 'intent://settings/#Intent;action=android.settings.SETTINGS;end', name: 'Settings' },
  { pattern: /(netflix|ott)\s*(khol|open)/i,            url: 'intent://netflix.com/#Intent;scheme=https;package=com.netflix.mediaclient;end', name: 'Netflix' },
  // Search commands
  { pattern: /youtube\s*(mein|pe|par|on)?\s*search\s+(.*)/i, url: 'https://www.youtube.com/search?q={q}', name: 'YouTube Search' },
  { pattern: /google\s*(mein|pe|par|on)?\s*search\s+(.*)/i,  url: 'https://www.google.com/search?q={q}', name: 'Google Search' },
  { pattern: /maps?\s*(mein|pe)?\s*(dhundh|search|find|navigate)\s+(.*)/i, url: 'https://maps.google.com/search/{q}', name: 'Maps Search' },
];

// ── App Control Commands ───────────────────────────────────────
const APP_CONTROLS: { pattern: RegExp; action: string; payload?: any }[] = [
  { pattern: /settings\s*(jaao|open|page|screen)/i,        action: 'navigate', payload: { path: '/settings' } },
  { pattern: /dashboard\s*(jaao|open|page|screen)/i,       action: 'navigate', payload: { path: '/dashboard' } },
  { pattern: /goals?\s*(jaao|open|page|screen)/i,          action: 'navigate', payload: { path: '/goals' } },
  { pattern: /automations?\s*(jaao|open|page|screen)/i,    action: 'navigate', payload: { path: '/automations' } },
  { pattern: /agent\s*(jaao|open|page|screen)/i,           action: 'navigate', payload: { path: '/agent' } },
  { pattern: /home\s*(jaao|wapis|back)/i,                  action: 'navigate', payload: { path: '/' } },
  { pattern: /(chat|history)\s*(clear|saaf|delete|hata)/i, action: 'clearChat', payload: {} },
  { pattern: /(dark\s*mode|raat\s*mode|dark\s*theme)/i,   action: 'setTheme', payload: { theme: 'dark' } },
  { pattern: /(light\s*mode|din\s*mode|light\s*theme)/i,  action: 'setTheme', payload: { theme: 'light' } },
  { pattern: /flash\s*mode/i,      action: 'setMode', payload: { mode: 'flash' } },
  { pattern: /think\s*mode/i,      action: 'setMode', payload: { mode: 'think' } },
  { pattern: /deep\s*mode/i,       action: 'setMode', payload: { mode: 'deep' } },
  { pattern: /auto\s*mode/i,       action: 'setMode', payload: { mode: 'auto' } },
  { pattern: /(sidebar|menu)\s*(khol|open|show)/i,        action: 'openSidebar', payload: {} },
  { pattern: /(sidebar|menu)\s*(band|close|hide)/i,       action: 'closeSidebar', payload: {} },
  { pattern: /scroll\s*(upar|up|top)/i,                   action: 'scroll', payload: { to: 'top' } },
  { pattern: /scroll\s*(niche|down|bottom)/i,             action: 'scroll', payload: { to: 'bottom' } },
];

// ── Tool Triggers ──────────────────────────────────────────────
const TOOL_TRIGGERS: { pattern: RegExp; tool: string }[] = [
  { pattern: /(weather|mausam|temperature|garmi|sardi)/i,      tool: 'weather' },
  { pattern: /(news|khabar|today news|aaj ka news)/i,          tool: 'news' },
  { pattern: /(bitcoin|btc|crypto|cryptocurrency)/i,           tool: 'crypto' },
  { pattern: /(joke|chutkula|funny|hasao)/i,                   tool: 'joke' },
  { pattern: /(image|photo|tasvir|generate|bana)\s+(.*)/i,     tool: 'image' },
  { pattern: /(reminder|yaad|alarm)\s+(.*)/i,                  tool: 'reminder' },
  { pattern: /(timer|countdown)\s+(\d+)/i,                     tool: 'timer' },
  { pattern: /(currency|rupee|dollar|convert)\s+(.*)/i,        tool: 'currency' },
  { pattern: /(calculate|calculate|math|ganit)\s+(.*)/i,       tool: 'calculator' },
  { pattern: /(time|kitna baj|kya time)/i,                     tool: 'time' },
  { pattern: /(wikipedia|wiki|ke baare mein)\s+(.*)/i,         tool: 'wiki' },
];

// ── Agent Intent Patterns ──────────────────────────────────────
const AGENT_PATTERNS = [
  /plan\s*(banao|bana|karo|de)/i,
  /step\s*by\s*step/i,
  /workflow|task\s*list|schedule/i,
  /(neet|jee|board|exam)\s*(plan|schedule|timetable|study)/i,
  /(study|padhne ka)\s*plan/i,
  /(project|assignment)\s*(plan|outline)/i,
  /poora\s*(process|steps?|guide)/i,
  /daily\s*(routine|schedule|plan)/i,
  /health\s*(plan|routine|diet)/i,
];

// ══════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ══════════════════════════════════════════════════════════════

export function detectVoiceCommand(text: string): CommandResult {
  const t = text.trim();

  // 1. Check deep links
  for (const dl of DEEP_LINKS) {
    const m = t.match(dl.pattern);
    if (m) {
      // Handle search queries with {q}
      let url = dl.url;
      if (url.includes('{q}') && m[2]) {
        url = url.replace('{q}', encodeURIComponent(m[2].trim()));
      }
      return {
        type: 'deeplink',
        action: 'open',
        payload: { url, name: dl.name },
        spoken: `${dl.name} khol raha hoon...`,
      };
    }
  }

  // 2. Check app control
  for (const ctrl of APP_CONTROLS) {
    if (ctrl.pattern.test(t)) {
      const labels: Record<string, string> = {
        navigate: `${ctrl.payload?.path} page pe ja raha hoon`,
        clearChat: 'Chat saaf kar raha hoon',
        setTheme: `${ctrl.payload?.theme} mode on`,
        setMode: `${ctrl.payload?.mode} mode set kiya`,
        openSidebar: 'Menu khol raha hoon',
        closeSidebar: 'Menu band kar raha hoon',
        scroll: `${ctrl.payload?.to === 'top' ? 'Upar' : 'Niche'} scroll kar raha hoon`,
      };
      return {
        type: 'appcontrol',
        action: ctrl.action,
        payload: ctrl.payload,
        spoken: labels[ctrl.action] || 'Ho gaya',
      };
    }
  }

  return { type: 'none', action: '' };
}

export function isAgentIntent(text: string): boolean {
  return AGENT_PATTERNS.some(p => p.test(text));
}

export function detectToolTrigger(text: string): string | null {
  for (const t of TOOL_TRIGGERS) {
    if (t.pattern.test(text)) return t.tool;
  }
  return null;
}

// Wake word detection
export function containsWakeWord(text: string): boolean {
  return /hey\s*jarvis|hi\s*jarvis|jarvis\s*(sun|bhai|yaar|sunn|hello|haan)|aye\s*jarvis|सुनो\s*जार्विस|जार्विस/i.test(text);
}

// Execute deep link (Android)
export function executeDeepLink(url: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (url.startsWith('intent://')) {
      // Android intent
      window.location.href = url;
      return true;
    }
    window.open(url, '_blank');
    return true;
  } catch {
    return false;
  }
}
