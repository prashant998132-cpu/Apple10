import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat  = searchParams.get('lat')  || process.env.USER_LAT  || '24.5362';
  const lon  = searchParams.get('lon')  || process.env.USER_LON  || '81.3003';
  const city = searchParams.get('city') || process.env.USER_CITY || 'Maihar';
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,relative_humidity_2m,windspeed_10m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,uv_index_max&forecast_days=7&timezone=auto`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) throw new Error('fetch failed');
    const d = await r.json();
    const WMO: Record<number, [string, string]> = {
      0: ['☀️', 'Clear'], 1: ['🌤️', 'Mostly clear'], 2: ['⛅', 'Partly cloudy'],
      3: ['☁️', 'Overcast'], 45: ['🌫️', 'Foggy'], 51: ['🌦️', 'Drizzle'],
      61: ['🌧️', 'Rain'], 63: ['🌧️', 'Heavy rain'], 71: ['❄️', 'Snow'],
      80: ['🌦️', 'Showers'], 95: ['⛈️', 'Storm'],
    };
    const c = d.current;
    const [icon, desc] = WMO[c.weathercode] || ['🌡️', 'Unknown'];
    return NextResponse.json({
      city,
      current: { temp: Math.round(c.temperature_2m), feels_like: Math.round(c.apparent_temperature), humidity: c.relative_humidity_2m, wind: Math.round(c.windspeed_10m), icon, desc, code: c.weathercode },
      forecast: d.daily.time.slice(0, 7).map((t: string, i: number) => ({
        date: t, max: Math.round(d.daily.temperature_2m_max[i]), min: Math.round(d.daily.temperature_2m_min[i]),
        rain: d.daily.precipitation_sum[i], uv: d.daily.uv_index_max[i],
        icon: (WMO[d.daily.weathercode[i]] || ['🌡️', ''])[0],
        desc: (WMO[d.daily.weathercode[i]] || ['', 'Unknown'])[1],
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
