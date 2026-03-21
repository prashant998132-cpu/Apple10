'use client';

export interface LocationData {
  lat: number;
  lon: number;
  city: string;
  region: string;
  country: string;
  display: string;
}

// Default: Maihar, MP (Prashant ka ghar)
const DEFAULT: LocationData = {
  lat: 24.5362, lon: 81.3003,
  city: 'Maihar', region: 'Madhya Pradesh', country: 'IN',
  display: 'Maihar, MP',
};

export async function getLocation(): Promise<LocationData> {
  // Try saved location first
  try {
    const saved = localStorage.getItem('jarvis_location');
    if (saved) return JSON.parse(saved);
  } catch {}

  // Try browser geolocation
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) { resolve(DEFAULT); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { signal: AbortSignal.timeout(4000) }
          );
          if (r.ok) {
            const d = await r.json();
            const loc: LocationData = {
              lat, lon,
              city: d.address?.city || d.address?.town || d.address?.village || 'Unknown',
              region: d.address?.state || '',
              country: d.address?.country_code?.toUpperCase() || 'IN',
              display: `${d.address?.city || d.address?.town || 'Unknown'}, ${d.address?.state || ''}`,
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
  return loc.display || `${loc.city}, ${loc.region}`;
}

export function getSavedLocation(): LocationData {
  try {
    const saved = localStorage.getItem('jarvis_location');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT;
}

export { DEFAULT as DEFAULT_LOCATION };
