import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

const AQI_LEVELS = [
  { max:50,   label:'Good',       emoji:'🟢', color:'#22c55e', advice:'Bahar jaana safe hai! 🌿' },
  { max:100,  label:'Moderate',   emoji:'🟡', color:'#f59e0b', advice:'Sensitive logon ko dhyan rakhna chahiye' },
  { max:150,  label:'Unhealthy (Sensitive)', emoji:'🟠', color:'#f97316', advice:'Sensitive groups bahar kum niklen' },
  { max:200,  label:'Unhealthy',  emoji:'🔴', color:'#ef4444', advice:'Mask pahno, exercise bahar mat karo' },
  { max:300,  label:'Very Unhealthy', emoji:'🟣', color:'#a855f7', advice:'Ghar mein raho, air purifier chalao' },
  { max:Infinity, label:'Hazardous', emoji:'⚫', color:'#dc2626', advice:'Emergency! Bahar bilkul mat niklo' },
];

function getAQILevel(aqi: number) {
  return AQI_LEVELS.find(l => aqi <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
}

function europeanToUSAQI(european: number): number {
  // European AQI (0-100 good scale) → US AQI approximate
  // Open-Meteo returns European scale: 0=good, 100=very poor
  if (european <= 20) return Math.round(european * 2.5);     // Good 0-50
  if (european <= 40) return Math.round(50 + (european-20) * 2.5); // Moderate
  if (european <= 60) return Math.round(100 + (european-40) * 2.5);
  if (european <= 80) return Math.round(150 + (european-60) * 2.5);
  return Math.round(200 + (european-80) * 5);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '24.5362');
  const lon = parseFloat(searchParams.get('lon') || '81.3003');
  const city = searchParams.get('city') || 'Your City';

  // Source 1: Open-Meteo Air Quality (completely free, no key)
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone&timezone=auto`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      const d = await r.json();
      const c = d.current;
      const europeanAQI = c.european_aqi || 0;
      const usAQI = europeanToUSAQI(europeanAQI);
      const level = getAQILevel(usAQI);

      return NextResponse.json({
        city,
        aqi: usAQI,
        europeanAqi: europeanAQI,
        level: level.label,
        emoji: level.emoji,
        color: level.color,
        advice: level.advice,
        pollutants: {
          pm25: Math.round((c.pm2_5 || 0) * 10) / 10,
          pm10: Math.round((c.pm10 || 0) * 10) / 10,
          co: Math.round((c.carbon_monoxide || 0) * 100) / 100,
          no2: Math.round((c.nitrogen_dioxide || 0) * 10) / 10,
          o3: Math.round((c.ozone || 0) * 10) / 10,
        },
        source: 'Open-Meteo (free)',
        ts: Date.now(),
      });
    }
  } catch {}

  // Source 2: WAQI (World Air Quality Index) — free tier
  const WAQI_KEY = process.env.WAQI_API_KEY || 'demo';
  try {
    const r = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_KEY}`,
      { signal: AbortSignal.timeout(6000) });
    if (r.ok) {
      const d = await r.json();
      if (d.status === 'ok' && d.data?.aqi) {
        const aqi = d.data.aqi;
        const level = getAQILevel(aqi);
        return NextResponse.json({
          city: d.data.city?.name || city,
          aqi,
          level: level.label,
          emoji: level.emoji,
          color: level.color,
          advice: level.advice,
          pollutants: {
            pm25: d.data.iaqi?.pm25?.v || 0,
            pm10: d.data.iaqi?.pm10?.v || 0,
            co: d.data.iaqi?.co?.v || 0,
            no2: d.data.iaqi?.no2?.v || 0,
            o3: d.data.iaqi?.o3?.v || 0,
          },
          source: 'WAQI',
          ts: Date.now(),
        });
      }
    }
  } catch {}

  return NextResponse.json({ error: 'Air quality data unavailable' }, { status: 503 });
}
