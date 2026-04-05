// JARVIS Super Morning Digest v2 — Auto via Vercel Cron
// Schedule: 0 3 * * * (3 AM UTC = 8:30 AM IST)

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;
  const GROQ_KEY  = process.env.GROQ_API_KEY;

  if (!BOT_TOKEN || !CHAT_ID) return NextResponse.json({ ok: false, reason: 'No telegram config' });

  const now = new Date();
  const dateStr = now.toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' });
  let digest = `🌅 *JARVIS Good Morning!*\n${dateStr}\n\n`;

  // ── Weather ──────────────────────────────────────────────
  try {
    const LAT  = process.env.USER_LAT  || '24.53';
    const LON  = process.env.USER_LON  || '81.3';
    const CITY = process.env.USER_CITY || 'Aapke Shehar';
    const w = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=1&timezone=auto`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (w.ok) {
      const d = await w.json(); const c = d.current;
      const wc = (n: number) => n <= 1 ? '☀️ Saaf' : n <= 3 ? '⛅ Badal' : n <= 67 ? '🌧️ Baarish' : '⛈️ Toofan';
      const max = d.daily?.temperature_2m_max?.[0];
      const min = d.daily?.temperature_2m_min?.[0];
      digest += `🌤️ *Mausam — ${CITY}*\n${Math.round(c.temperature_2m)}°C | ${wc(c.weathercode)}\nMax: ${Math.round(max)}° / Min: ${Math.round(min)}° | Humidity: ${c.relative_humidity_2m}%\n\n`;
    }
  } catch {}

  // ── Crypto snapshot ───────────────────────────────────────
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=inr,usd', { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const d = await r.json();
      const btc = d.bitcoin;
      const eth = d.ethereum;
      digest += `💰 *Crypto Snapshot*\n₿ BTC: ₹${btc?.inr?.toLocaleString('en-IN')} ($${btc?.usd?.toLocaleString()})\n🔷 ETH: ₹${eth?.inr?.toLocaleString('en-IN')}\n\n`;
    }
  } catch {}

  // ── India News Headlines (RSS) ────────────────────────────
  try {
    const r = await fetch('https://feeds.feedburner.com/ndtvnews-india-news', { signal: AbortSignal.timeout(6000) });
    if (r.ok) {
      const t = await r.text();
      const items = t.match(/<title><\!\[CDATA\[([^\]]+)\]\]><\/title>/g)?.slice(1, 4) || 
                    t.match(/<title>([^<]+)<\/title>/g)?.slice(1, 4) || [];
      if (items.length) {
        const headlines = items.map(i => i.replace(/<\/?title>/g, '').replace(/<\!\[CDATA\[|\]\]>/g, '').trim()).join('\n• ');
        digest += `📰 *Aaj ki Khabar*\n• ${headlines}\n\n`;
      }
    }
  } catch {}

  // ── NEET Countdown ────────────────────────────────────────
  const neetDate = new Date('2026-05-03T00:00:00+05:30');
  const neetDays = Math.max(0, Math.ceil((neetDate.getTime() - now.getTime()) / 86400000));
  digest += `🎯 *NEET 2026: ${neetDays} din baaki*\n`;

  // ── AI Motivational Quote ──────────────────────────────────
  if (GROQ_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Give one powerful motivational quote for a NEET student in Hinglish. Just the quote, max 2 lines. Make it very inspiring.' }],
          max_tokens: 100, temperature: 0.9,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const d = await r.json();
        const q = d.choices?.[0]?.message?.content;
        if (q) digest += `\n💡 *Quote:*\n_${q.trim()}_\n`;
      }
    } catch {}
  }

  // ── Study Tip ─────────────────────────────────────────────
  const STUDY_TIPS = [
    'Aaj Pomodoro technique try karo: 25 min study + 5 min break 🍅',
    'Ek revision karo — purane notes dekho aaj 📚',
    'Active recall technique: notes band karo aur yaad karne ki koshish karo 🧠',
    'Aaj ka weak topic identify karo aur usse 1 ghante do 🎯',
    'Previous year MCQs solve karo — pattern samjho 📝',
  ];
  const tip = STUDY_TIPS[now.getDay() % STUDY_TIPS.length];
  digest += `\n⚡ *Study Tip:* ${tip}`;

  digest += `\n\n📱 [JARVIS App](https://apple10.vercel.app) | /digest for more`;

  // ── Send to Telegram ───────────────────────────────────────
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: digest, parse_mode: 'Markdown', disable_web_page_preview: true }),
  });

  const telegramResult = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: true, sent: telegramResult.ok, time: now.toISOString(), neetDays });
}
