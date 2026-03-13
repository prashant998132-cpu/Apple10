// ══════════════════════════════════════════════════════════════
// JARVIS CRON AGENT — Hourly background data prefetch
// Vercel Hobby plan: 1 cron job FREE
// ══════════════════════════════════════════════════════════════
// vercel.json mein add karo:
// "crons": [{ "path": "/api/cron", "schedule": "0 * * * *" }]
// ══════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
import { notify } from '@/lib/notify';
export const maxDuration = 30;

// Simple in-memory cache (resets on cold start, but good enough)
// For persistent cache, upgrade to Vercel KV (free 256MB)
const CACHE: Record<string, { data: any; ts: number }> = {};
const TTL = { weather: 1800000, crypto: 300000, news: 600000 }; // 30min, 5min, 10min

export async function GET(req: NextRequest) {
  // Verify it's from Vercel Cron (security) — skip if CRON_SECRET not configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results: Record<string, any> = {};
  const errors: string[] = [];

  // Parallel fetch all data
  const [weather, crypto, news] = await Promise.allSettled([
    fetchWeather(),
    fetchCrypto(),
    fetchNews(),
  ]);

  if (weather.status === 'fulfilled') results.weather = weather.value;
  else errors.push('weather: ' + weather.reason);

  if (crypto.status === 'fulfilled') results.crypto = crypto.value;
  else errors.push('crypto: ' + crypto.reason);

  if (news.status === 'fulfilled') results.news = news.value;
  else errors.push('news: ' + news.reason);

  // Morning briefing via ntfy.sh (no Telegram needed)
  const hour = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false });
  if (parseInt(hour) === 8 && results.weather) {
    const w = results.weather?.current;
    const wc = (code: number) => code <= 1 ? '☀️' : code <= 3 ? '⛅' : code <= 61 ? '🌦️' : '🌧️';
    const weatherStr = w ? `${Math.round(w.temperature_2m)}°C ${wc(w.weathercode)}, Humidity ${w.relative_humidity_2m}%` : 'N/A';
    const btcStr = results.crypto?.bitcoin?.inr
      ? `₹${Math.round(results.crypto.bitcoin.inr / 1000)}K`
      : 'N/A';
    const ethStr = results.crypto?.ethereum?.inr
      ? `ETH ₹${Math.round(results.crypto.ethereum.inr / 1000)}K`
      : '';

    // Free news — no API key needed (Google News RSS)
    let newsHeadline = '';
    try {
      const rss = await fetch('https://news.google.com/rss/headlines/section/geo/IN?hl=en-IN&gl=IN&ceid=IN:en', { signal: AbortSignal.timeout(5000) });
      const text = await rss.text();
      // Extract first title from RSS (no 's' flag needed)
      const itemStart = text.indexOf('<item>');
      if (itemStart > -1) {
        const itemChunk = text.slice(itemStart, itemStart + 500);
        const cdataMatch = itemChunk.match(/<!\[CDATA\[(.*?)\]\]>/);
        if (cdataMatch) newsHeadline = `\n📰 ${cdataMatch[1].slice(0, 80)}`;
      }
    } catch {}

    const briefMsg = `${weatherStr}\n₿ BTC: ${btcStr} ${ethStr}${newsHeadline}\n\nAaj ka din badhiya rahega Jons Bhai! 💪`;
    await notify.morning(weatherStr, btcStr + (newsHeadline ? '\n' + newsHeadline : ''));
  }

  return NextResponse.json({
    ok: true,
    ts: Date.now(),
    fetched: Object.keys(results),
    errors: errors.length ? errors : undefined,
  });
}

async function fetchWeather() {
  const r = await fetch(
    'https://api.open-meteo.com/v1/forecast?latitude=24.53&longitude=81.3&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=3&timezone=Asia/Kolkata',
    { signal: AbortSignal.timeout(8000) }
  );
  if (!r.ok) throw new Error('Weather API failed');
  return r.json();
}

async function fetchCrypto() {
  const r = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin&vs_currencies=inr,usd',
    { signal: AbortSignal.timeout(8000) }
  );
  if (!r.ok) throw new Error('Crypto API failed');
  return r.json();
}

async function fetchNews() {
  const key = process.env.NEWS_API_KEY;
  if (!key) return null;
  const r = await fetch(
    `https://newsapi.org/v2/top-headlines?country=in&pageSize=5&apiKey=${key}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!r.ok) return null;
  const d = await r.json();
  return (d.articles || []).slice(0, 5).map((a: any) => ({
    title: a.title,
    source: a.source?.name,
    url: a.url,
  }));
}


// ── Also handle POST for manual trigger ─────────────────────
export async function POST(req: NextRequest) {
  return GET(req);
}
