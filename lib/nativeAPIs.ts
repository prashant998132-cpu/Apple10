'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS NATIVE APIs v1 — Browser superpowers, ₹0 cost
// Battery · WakeLock · Contacts · Badge · MediaSession
// NetworkInfo · Clipboard · Vibration · ShareFiles
// ══════════════════════════════════════════════════════════════

// ─── 1. BATTERY API ──────────────────────────────────────────
export interface BatteryInfo {
  level: number;        // 0–1
  charging: boolean;
  chargingTime: number; // seconds to full
  dischargingTime: number;
}

let _batteryObj: any = null;

export async function getBattery(): Promise<BatteryInfo | null> {
  if (typeof navigator === 'undefined') return null;
  if (!('getBattery' in navigator)) return null;
  try {
    if (!_batteryObj) _batteryObj = await (navigator as any).getBattery();
    return {
      level: _batteryObj.level,
      charging: _batteryObj.charging,
      chargingTime: _batteryObj.chargingTime,
      dischargingTime: _batteryObj.dischargingTime,
    };
  } catch { return null; }
}

export function watchBattery(cb: (info: BatteryInfo) => void): () => void {
  if (typeof navigator === 'undefined' || !('getBattery' in navigator)) return () => {};
  let cancelled = false;
  (navigator as any).getBattery().then((bat: any) => {
    if (cancelled) return;
    _batteryObj = bat;
    const update = () => cb({ level: bat.level, charging: bat.charging, chargingTime: bat.chargingTime, dischargingTime: bat.dischargingTime });
    bat.addEventListener('levelchange', update);
    bat.addEventListener('chargingchange', update);
    bat.addEventListener('chargingtimechange', update);
    bat.addEventListener('dischargingtimechange', update);
    update(); // fire immediately
  }).catch(() => {});
  return () => { cancelled = true; };
}

export function formatBattery(info: BatteryInfo): string {
  const pct = Math.round(info.level * 100);
  const icon = info.charging ? '⚡' : pct > 60 ? '🔋' : pct > 20 ? '🪫' : '🔴';
  const timeStr = info.charging && info.chargingTime < Infinity
    ? ` — Full mein ${Math.round(info.chargingTime / 60)} min`
    : !info.charging && info.dischargingTime < Infinity
    ? ` — ${Math.round(info.dischargingTime / 3600)}h ${Math.round((info.dischargingTime % 3600) / 60)}m bacha`
    : '';
  return `${icon} ${pct}%${timeStr}`;
}

// ─── 2. SCREEN WAKE LOCK ─────────────────────────────────────
let _wakeLock: any = null;

export async function requestWakeLock(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return false;
  try {
    _wakeLock = await (navigator as any).wakeLock.request('screen');
    _wakeLock.addEventListener('release', () => { _wakeLock = null; });
    return true;
  } catch { return false; }
}

export function releaseWakeLock() {
  if (_wakeLock) { _wakeLock.release().catch(() => {}); _wakeLock = null; }
}

export function isWakeLockActive(): boolean {
  return _wakeLock !== null;
}

// Re-acquire wake lock after page visibility change (phone unlock)
export function setupWakeLockPersist() {
  if (typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && _wakeLock === null) {
      requestWakeLock().catch(() => {});
    }
  });
}

// ─── 3. CONTACT PICKER API ───────────────────────────────────
export interface Contact {
  name: string[];
  tel: string[];
  email: string[];
}

export function isContactPickerSupported(): boolean {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;
}

export async function pickContact(props: ('name' | 'tel' | 'email')[] = ['name', 'tel']): Promise<Contact | null> {
  if (!isContactPickerSupported()) return null;
  try {
    const contacts = await (navigator as any).contacts.select(props, { multiple: false });
    if (contacts.length === 0) return null;
    return contacts[0] as Contact;
  } catch { return null; }
}

export async function pickContactForCall(): Promise<{ name: string; number: string } | null> {
  const contact = await pickContact(['name', 'tel']);
  if (!contact || !contact.tel?.length) return null;
  return {
    name: contact.name?.[0] || 'Unknown',
    number: contact.tel[0].replace(/\s/g, ''),
  };
}

// ─── 4. BADGING API ──────────────────────────────────────────
export function setBadge(count: number) {
  if (typeof navigator === 'undefined') return;
  if ('setAppBadge' in navigator) {
    (navigator as any).setAppBadge(count > 0 ? count : 0).catch(() => {});
  }
}

export function clearBadge() {
  if (typeof navigator === 'undefined') return;
  if ('clearAppBadge' in navigator) {
    (navigator as any).clearAppBadge().catch(() => {});
  }
}

// ─── 5. NETWORK INFO API ─────────────────────────────────────
export type NetworkQuality = 'fast' | 'medium' | 'slow' | 'offline';

export function getNetworkQuality(): NetworkQuality {
  if (typeof navigator === 'undefined') return 'fast';
  if (!navigator.onLine) return 'offline';
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (!conn) return 'fast';
  const effectiveType = conn.effectiveType;
  if (effectiveType === '4g') return 'fast';
  if (effectiveType === '3g') return 'medium';
  if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'slow';
  if (conn.downlink > 1) return 'fast';
  if (conn.downlink > 0.3) return 'medium';
  return 'slow';
}

export function networkQualityToMode(quality: NetworkQuality, currentMode: string): string {
  if (quality === 'offline') return currentMode; // offline — let it fail gracefully
  if (quality === 'slow' && currentMode === 'deep') return 'flash';   // 2G pe Deep → Flash
  if (quality === 'slow' && currentMode === 'think') return 'flash';  // 2G pe Think → Flash
  if (quality === 'medium' && currentMode === 'deep') return 'think'; // 3G pe Deep → Think
  return currentMode;
}

export function watchNetwork(cb: (quality: NetworkQuality) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb(getNetworkQuality());
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  const conn = (navigator as any).connection;
  if (conn) conn.addEventListener('change', handler);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
    if (conn) conn.removeEventListener('change', handler);
  };
}

// ─── 6. MEDIA SESSION API ────────────────────────────────────
export function setupMediaSession(opts: {
  title: string;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
}) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: opts.title,
    artist: 'JARVIS AI',
    album: 'JARVIS Assistant',
    artwork: [
      { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  });
  if (opts.onPlay) navigator.mediaSession.setActionHandler('play', opts.onPlay);
  if (opts.onPause) navigator.mediaSession.setActionHandler('pause', opts.onPause);
  if (opts.onStop) navigator.mediaSession.setActionHandler('stop', opts.onStop);
}

export function clearMediaSession() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = null;
  (['play', 'pause', 'stop', 'previoustrack', 'nexttrack'] as MediaSessionAction[]).forEach(a => {
    try { navigator.mediaSession.setActionHandler(a, null); } catch {}
  });
}

export function setMediaSessionPlayback(state: 'playing' | 'paused' | 'none') {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = state;
}

// ─── 7. VIBRATION API ────────────────────────────────────────
export function vibrate(pattern: number | number[] = 50) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export const VIBRATE = {
  tap: () => vibrate(30),
  success: () => vibrate([50, 30, 50]),
  error: () => vibrate([100, 50, 100, 50, 100]),
  notification: () => vibrate([50, 100, 50]),
  wakeWord: () => vibrate([30, 20, 30, 20, 80]),
};

// ─── 8. CLIPBOARD API ────────────────────────────────────────
export async function readClipboard(): Promise<string | null> {
  if (typeof navigator === 'undefined') return null;
  try {
    if ('clipboard' in navigator && 'readText' in navigator.clipboard) {
      return await navigator.clipboard.readText();
    }
  } catch {}
  return null;
}

export async function writeClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { return false; }
}

// ─── 9. WEB SHARE API (Files) ────────────────────────────────
export async function shareFile(file: File, title = 'JARVIS', text = ''): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  try {
    await navigator.share({ title, text, files: [file] });
    return true;
  } catch { return false; }
}

export async function shareText(text: string, title = 'JARVIS'): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  try {
    await navigator.share({ title, text });
    return true;
  } catch { return false; }
}

// ─── 10. DEVICE CAPABILITIES SNAPSHOT ───────────────────────
export interface DeviceCapabilities {
  battery: boolean;
  wakeLock: boolean;
  contacts: boolean;
  badge: boolean;
  network: boolean;
  mediaSession: boolean;
  share: boolean;
  clipboard: boolean;
  vibration: boolean;
  camera: boolean;
  speech: boolean;
  notifications: boolean;
  serviceWorker: boolean;
  bluetooth: boolean;
  nfc: boolean;
}

export function getDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') return {} as DeviceCapabilities;
  const nav = navigator as any;
  return {
    battery: 'getBattery' in navigator,
    wakeLock: 'wakeLock' in navigator,
    contacts: 'contacts' in navigator,
    badge: 'setAppBadge' in navigator,
    network: 'connection' in navigator,
    mediaSession: 'mediaSession' in navigator,
    share: 'share' in navigator,
    clipboard: 'clipboard' in navigator,
    vibration: 'vibrate' in navigator,
    camera: 'mediaDevices' in navigator,
    speech: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    bluetooth: 'bluetooth' in navigator,
    nfc: 'NDEFReader' in window,
  };
}

export function describeCapabilities(caps: DeviceCapabilities): string {
  const on: string[] = [];
  if (caps.battery) on.push('Battery');
  if (caps.contacts) on.push('Contacts');
  if (caps.wakeLock) on.push('WakeLock');
  if (caps.camera) on.push('Camera');
  if (caps.speech) on.push('Voice');
  if (caps.nfc) on.push('NFC');
  if (caps.bluetooth) on.push('Bluetooth');
  return on.length ? `📱 Available: ${on.join(', ')}` : '📱 Basic browser';
}
