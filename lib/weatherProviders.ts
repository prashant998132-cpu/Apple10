// ══════════════════════════════════════════════════════════════
// JARVIS WEATHER — Multi-Provider Smart Router
// Research: Open-Meteo best no-key, WeatherAPI generous free,
//           met.no accurate, wttr.in simple
// ══════════════════════════════════════════════════════════════

const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHERAPI_KEY  = process.env.WEATHERAPI_KEY;
const TOMORROW_KEY    = process.env.TOMORROW_API_KEY;

// Provider 1: Open-Meteo (no key, best free, 10ms response)
export async function weatherOpenMeteo(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&forecast_days=7&timezone=Asia/Kolkata`;
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const d = await r.json();
    const c = d.current;

    const codeMap: Record<number, [string, string]> = {
      0: ['☀️', 'Bilkul saaf'], 1: ['🌤️', 'Mostly clear'], 2: ['⛅', 'Thoda badal'],
      3: ['☁️', 'Fully cloudy'], 45: ['🌫️', 'Fog'], 48: ['🌫️', ''},
      61: ['🌧️', 'Halki baarish'], 63: ['🌧️', 'Baarish'], 65: ['🌧️', 'Bhari baarish'],
      71: ['❄️', 'Snow'], 80: ['🌦️', 'Shower'], 95: ['⛈️', 'Aandhi toofan'],
    };
    const [icon, desc] = codeMap[c.weathercode] || ['🌡️', 'Unknown'];

    const daily = d.daily;
    const forecast = daily.time?.slice(0, 5).map((day: string, i: number) => {
      const [fi] = codeMap[daily.weathercode?.[i]] || ['🌡️', ''];
      const date = new Date(day);
      const name = date.toLocaleDateString('hi-IN', { weekday: 'short' });
      return `${name} ${fi} ${Math.round(daily.temperature_2m_max?.[i])}°/${Math.round(daily.temperature_2m_min?.[i])}°`;
    }).join(' | ');

    return `${icon} **${Math.round(c.temperature_2m)}°C** — ${desc}\n💨 Wind: ${Math.round(c.windspeed_10m)} km/h | 💧 Humidity: ${c.relativehumidity_2m}%\n\n📅 **5 Din:**\n${forecast}`;
  } catch { return null; }
}

// Provider 2: WeatherAPI (free 1M/month with key)
export async function weatherWeatherAPI(location: string): Promise<string | null> {
  if (!WEATHERAPI_KEY) return null;
  try {
    const r = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(location)}&days=3&aqi=no`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const c = d.current;
    return `🌡️ **${Math.round(c.temp_c)}°C** — ${c.condition.text}\n💨 ${Math.round(c.wind_kph)} km/h | 💧 ${c.humidity}% | 👁️ ${c.vis_km}km visibility\n📍 ${d.location.name}, ${d.location.region}`;
  } catch { return null; }
}

// Provider 3: wttr.in (no key, always works, simple)
export async function weatherWttr(location: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://wttr.in/${encodeURIComponent(location)}?format=j1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const c = d.current_condition?.[0];
    if (!c) return null;
    return `🌡️ **${c.temp_C}°C** — ${c.weatherDesc?.[0]?.value}\n💧 Humidity: ${c.humidity}% | 💨 Wind: ${c.windspeedKmph} km/h`;
  } catch { return null; }
}

// Provider 4: met.no (no key, Norwegian meteorological, very accurate)
export async function weatherMetNo(lat: number, lon: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
      {
        headers: { 'User-Agent': 'JARVIS-AI/1.0 prashant998132@gmail.com' },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const now = d.properties?.timeseries?.[0]?.data?.instant?.details;
    if (!now) return null;
    const next1h = d.properties?.timeseries?.[0]?.data?.next_1_hours?.summary?.symbol_code || '';
    return `🌡️ **${Math.round(now.air_temperature)}°C**\n💧 Humidity: ${Math.round(now.relative_humidity)}% | 💨 Wind: ${Math.round(now.wind_speed * 3.6)} km/h\n🌤️ ${next1h.replace(/_/g, ' ')}`;
  } catch { return null; }
}

// ── Smart weather fetcher — tries all providers ──────────────
export async function getWeather(lat = 24.53, lon = 81.3, location = 'Maihar'): Promise<string> {
  // Try providers in parallel, use first success
  const results = await Promise.allSettled([
    weatherOpenMeteo(lat, lon),
    weatherWeatherAPI(location),
    weatherMetNo(lat, lon),
    weatherWttr(location),
  ]);

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) return r.value;
  }

  return `⚠️ Abhi weather data fetch nahi ho pa raha. Thodi der mein try karo.`;
}
