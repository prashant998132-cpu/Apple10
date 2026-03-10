'use client';

export interface LocationData {
  lat: number; lon: number;
  city?: string; state?: string; country?: string;
  source?: 'gps' | 'ip' | 'cache' | 'manual';
  ts: number;
}

const LOC_KEY = 'jarvis_location';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

// ── Get location — GPS first, IP fallback ─────────────────────
export async function getLocation(forceRefresh = false): Promise<LocationData> {
  // 1. Try cache first (if recent enough)
  if (!forceRefresh) {
    const cached = getCachedLocation();
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached;
  }

  // 2. Try GPS (browser geolocation)
  const gps = await tryGPS();
  if (gps) return gps;

  // 3. Fallback: IP-based location (no key needed)
  const ip = await tryIPLocation();
  if (ip) return ip;

  // 4. Last resort: blank — do NOT hardcode any city
  return { lat: 0, lon: 0, ts: Date.now(), source: 'manual' };
}

async function tryGPS(): Promise<LocationData | null> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return null;
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`,
            { headers: { 'User-Agent': 'JARVIS-PWA/8.0' } }
          );
          const d = await r.json();
          const addr = d.address || {};
          const loc: LocationData = {
            lat, lon, ts: Date.now(), source: 'gps',
            city: addr.city || addr.town || addr.village || addr.county || addr.suburb,
            state: addr.state,
            country: addr.country_code?.toUpperCase(),
          };
          saveLocation(loc);
          resolve(loc);
        } catch {
          const loc: LocationData = { lat, lon, ts: Date.now(), source: 'gps' };
          saveLocation(loc);
          resolve(loc);
        }
      },
      () => resolve(null),
      { timeout: 6000, maximumAge: CACHE_TTL }
    );
  });
}

async function tryIPLocation(): Promise<LocationData | null> {
  // Try multiple free IP geo APIs — no key needed
  const apis = [
    () => fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) })
      .then(r => r.json())
      .then(d => ({
        lat: d.latitude, lon: d.longitude,
        city: d.city, state: d.region, country: d.country_code,
      })),
    () => fetch('https://ip-api.com/json/?fields=lat,lon,city,regionName,countryCode', { signal: AbortSignal.timeout(5000) })
      .then(r => r.json())
      .then(d => ({
        lat: d.lat, lon: d.lon,
        city: d.city, state: d.regionName, country: d.countryCode,
      })),
  ];

  for (const api of apis) {
    try {
      const d = await api();
      if (d.lat && d.lon) {
        const loc: LocationData = { ...d, ts: Date.now(), source: 'ip' };
        saveLocation(loc);
        return loc;
      }
    } catch {}
  }
  return null;
}

// ── Cache helpers ──────────────────────────────────────────────
export function getCachedLocation(): LocationData | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(LOC_KEY) || 'null'); } catch { return null; }
}

function saveLocation(loc: LocationData) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LOC_KEY, JSON.stringify(loc)); } catch {}
}

export function clearLocationCache() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(LOC_KEY); } catch {}
}

// ── Format for display ─────────────────────────────────────────
export function formatLocation(loc: LocationData | null): string {
  if (!loc || !loc.city) return 'Unknown location';
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  return parts.join(', ');
}

// Legacy compat
export function getCurrentLocation() { return getLocation(); }
export function getSavedPlaces(): LocationData[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('jarvis_saved_places') || '[]'); } catch { return []; }
}
export function savePlace(place: LocationData) {
  if (typeof window === 'undefined') return;
  const places = getSavedPlaces();
  places.push(place);
  try { localStorage.setItem('jarvis_saved_places', JSON.stringify(places.slice(-20))); } catch {}
}
