'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS PERMISSIONS — Request all browser permissions at once
// Call requestAllPermissions() on first launch
// ══════════════════════════════════════════════════════════════

export interface PermissionStatus {
  name: string;
  emoji: string;
  granted: boolean;
  error?: string;
}

export async function requestAllPermissions(): Promise<PermissionStatus[]> {
  const results: PermissionStatus[] = [];

  // 1. Notifications
  try {
    const r = await Notification.requestPermission();
    results.push({ name: 'Notifications', emoji: '🔔', granted: r === 'granted' });
  } catch { results.push({ name: 'Notifications', emoji: '🔔', granted: false }); }

  // 2. Location (precise)
  await new Promise<void>(resolve => {
    if (!navigator.geolocation) { results.push({ name: 'Location', emoji: '📍', granted: false }); resolve(); return; }
    navigator.geolocation.getCurrentPosition(
      () => { results.push({ name: 'Location', emoji: '📍', granted: true }); resolve(); },
      () => { results.push({ name: 'Location', emoji: '📍', granted: false }); resolve(); },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });

  // 3. Camera
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: true });
    s.getTracks().forEach(t => t.stop());
    results.push({ name: 'Camera', emoji: '📷', granted: true });
  } catch { results.push({ name: 'Camera', emoji: '📷', granted: false }); }

  // 4. Microphone
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach(t => t.stop());
    results.push({ name: 'Microphone', emoji: '🎤', granted: true });
  } catch { results.push({ name: 'Microphone', emoji: '🎤', granted: false }); }

  // 5. Clipboard read
  try {
    await navigator.clipboard.readText();
    results.push({ name: 'Clipboard', emoji: '📋', granted: true });
  } catch { results.push({ name: 'Clipboard', emoji: '📋', granted: false }); }

  // 6. Contacts
  const contactsOk = 'contacts' in navigator && 'ContactsManager' in window;
  results.push({ name: 'Contacts', emoji: '👥', granted: contactsOk });

  // 7. Bluetooth
  try {
    if ('bluetooth' in navigator) {
      await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
      results.push({ name: 'Bluetooth', emoji: '🔵', granted: true });
    } else {
      results.push({ name: 'Bluetooth', emoji: '🔵', granted: false });
    }
  } catch { results.push({ name: 'Bluetooth', emoji: '🔵', granted: false }); }

  // 8. Persistent Storage
  try {
    const ok = await navigator.storage.persist();
    results.push({ name: 'Storage Persist', emoji: '💾', granted: ok });
  } catch { results.push({ name: 'Storage Persist', emoji: '💾', granted: false }); }

  // 9. Motion Sensors
  try {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      const r = await (DeviceMotionEvent as any).requestPermission();
      results.push({ name: 'Motion Sensor', emoji: '📱', granted: r === 'granted' });
    } else {
      results.push({ name: 'Motion Sensor', emoji: '📱', granted: 'DeviceMotionEvent' in window });
    }
  } catch { results.push({ name: 'Motion Sensor', emoji: '📱', granted: false }); }

  // 10. Screen Wake Lock
  try {
    const wl = await (navigator as any).wakeLock.request('screen');
    wl.release();
    results.push({ name: 'Wake Lock', emoji: '🌙', granted: true });
  } catch { results.push({ name: 'Wake Lock', emoji: '🌙', granted: false }); }

  // 11. NFC
  try {
    if ('NDEFReader' in window) {
      const r = new (window as any).NDEFReader();
      await r.scan();
      results.push({ name: 'NFC', emoji: '📡', granted: true });
    } else {
      results.push({ name: 'NFC', emoji: '📡', granted: false });
    }
  } catch { results.push({ name: 'NFC', emoji: '📡', granted: false }); }

  // 12. Idle Detection
  try {
    if ('IdleDetector' in window) {
      const state = await (window as any).IdleDetector.requestPermission();
      results.push({ name: 'Idle Detection', emoji: '⏱️', granted: state === 'granted' });
    } else {
      results.push({ name: 'Idle Detection', emoji: '⏱️', granted: false });
    }
  } catch { results.push({ name: 'Idle Detection', emoji: '⏱️', granted: false }); }

  // Save results
  try {
    localStorage.setItem('jarvis_permissions', JSON.stringify({
      ts: Date.now(),
      results: results.map(r => ({ name: r.name, granted: r.granted }))
    }));
  } catch {}

  return results;
}

export function getStoredPermissions(): PermissionStatus[] | null {
  try {
    const raw = localStorage.getItem('jarvis_permissions');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.results;
  } catch { return null; }
}

export function hasRequestedPermissions(): boolean {
  try { return !!localStorage.getItem('jarvis_permissions'); } catch { return false; }
}
