'use client';

// ══════════════════════════════════════════════════════
// JARVIS Device Info — Battery + Network + WiFi
// ══════════════════════════════════════════════════════

export interface DeviceStatus {
  battery: { level: number; charging: boolean; time: string } | null;
  network: { type: string; speed: string; online: boolean; downlink: number } | null;
  memory: { used: number; total: number } | null;
}

export async function getDeviceStatus(): Promise<DeviceStatus> {
  const status: DeviceStatus = { battery: null, network: null, memory: null };

  // Battery
  try {
    const nav = navigator as any;
    if ('getBattery' in nav) {
      const battery = await nav.getBattery();
      const level = Math.round(battery.level * 100);
      let time = '';
      if (battery.charging) {
        time = battery.chargingTime === Infinity ? 'Charging' : `Full in ${Math.round(battery.chargingTime / 60)}m`;
      } else {
        time = battery.dischargingTime === Infinity ? '' : `${Math.round(battery.dischargingTime / 60)}m left`;
      }
      status.battery = { level, charging: battery.charging, time };
    }
  } catch {}

  // Network
  try {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      const typeMap: Record<string, string> = {
        'wifi': 'WiFi', 'cellular': '4G/5G', 'ethernet': 'Ethernet',
        '4g': '4G', '3g': '3G', '2g': '2G', 'slow-2g': '2G Slow', 'none': 'Offline'
      };
      const type = typeMap[conn.effectiveType || conn.type || ''] || 'Unknown';
      const downlink = conn.downlink || 0;
      const speed = downlink > 10 ? 'Fast' : downlink > 1 ? 'Medium' : 'Slow';
      status.network = { type, speed, online: navigator.onLine, downlink };
    } else {
      status.network = { type: navigator.onLine ? 'Online' : 'Offline', speed: '', online: navigator.onLine, downlink: 0 };
    }
  } catch {}

  // Memory (Chrome only)
  try {
    const mem = (performance as any).memory;
    if (mem) {
      status.memory = {
        used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
        total: Math.round(mem.jsHeapSizeLimit / 1024 / 1024),
      };
    }
  } catch {}

  return status;
}

export function formatDeviceStatus(s: DeviceStatus): string {
  const parts = [];
  if (s.battery) {
    const icon = s.battery.charging ? '⚡' : s.battery.level > 50 ? '🔋' : s.battery.level > 20 ? '🪫' : '🔴';
    parts.push(icon + ' ' + s.battery.level + '%' + (s.battery.time ? ' · ' + s.battery.time : ''));
  }
  if (s.network) {
    const icon = s.network.type.includes('WiFi') ? '📶' : '📡';
    parts.push(icon + ' ' + s.network.type + (s.network.speed ? ' · ' + s.network.speed : ''));
  }
  return parts.join('  ');
}

// Live battery listener
export function watchBattery(cb: (status: { level: number; charging: boolean }) => void): () => void {
  const nav = navigator as any;
  if (!('getBattery' in nav)) return () => {};

  let battery: any = null;

  nav.getBattery().then((b: any) => {
    battery = b;
    const update = () => cb({ level: Math.round(b.level * 100), charging: b.charging });
    update();
    b.addEventListener('levelchange', update);
    b.addEventListener('chargingchange', update);
  }).catch(() => {});

  return () => {
    if (battery) {
      battery.removeEventListener('levelchange', () => {});
      battery.removeEventListener('chargingchange', () => {});
    }
  };
}
