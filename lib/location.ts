'use client';

export interface LocationData {
  lat: number;
  lon: number;
  city: string;
  region: string;
  country: string;
  display: string;
}

const DEFAULT: LocationData = {
  lat: 24.5362, lon: 81.3003,
  city: 'Maihar', region: 'Madhya Pradesh', country: 'IN',
  display: 'Maihar, MP',
};

export async function getLocation(): Promise<LocationData> {
  try {
    const saved = localStorage.getItem('jarvis_location');
    if (saved) return JSON.parse(saved);
  } catch {}

  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) { resolve(DEFAULT); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const url = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json';
          const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
          if (r.ok) {
            const d = await r.json();
            const loc: LocationData = {
              lat, lon,
              city: d.address?.city || d.address?.town || d.address?.village || 'Unknown',
              region: d.address?.state || '',
              country: d.address?.country_code?.toUpperCase() || 'IN',
              display: (d.address?.city || d.address?.town || 'Unknown') + ', ' + (d.address?.state || ''),
            };
            try { localStorage.setItem('jarvis_location', JSON.stringify(loc)); } catch {}
            resolve(loc); return;
          }
        } catch {}
        resolve({ lat, lon, city: 'Current Location', region: '', country: 'IN', display: 'Current Location' });
      },
      () => resolve(DEFAULT),
      { timeout: 5000, maximumAge: 300000 }
    );
  });
}

export function formatLocation(loc: LocationData): string {
  return loc.display || loc.city + ', ' + loc.region;
}

export function getCachedLocation(): LocationData {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const saved = localStorage.getItem('jarvis_location');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT;
}

export function getSavedLocation(): LocationData {
  return getCachedLocation();
}

export { DEFAULT as DEFAULT_LOCATION };
