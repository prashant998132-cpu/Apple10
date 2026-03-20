// ══════════════════════════════════════════════════════════════
// JARVIS CRON JOBS — v32
// Vercel Cron: hourly background tasks (free on Vercel hobby)
// Add to vercel.json:
// "crons": [{ "path": "/api/cron", "schedule": "0 * * * *" }]
//
// Tasks:
// 1. Prefetch weather (cache it for instant response)
// 2. Send morning briefing via ntfy at 6am IST
// 3. Send evening summary at 9pm IST
// 4. Check upcoming reminders
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

const NTFY_TOPIC  = process.env.NTFY_TOPIC;
const GROQ_KEY    = process.env.GROQ_API_KEY;
const GEMINI_KEY  = process.env.GEMINI_API_KEY;
const TG_TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID  = process.env.TELEGRAM_CHAT_ID;

// Verify cron secret (set CRON_SECRET in Vercel env vars)
const CRON_SECRET = process.env.CRON_SECRET;

async function getWeather() {
  try {
    const r = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=24.53&longitude=81.3&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=Asia/Kolkata',
      { signal: AbortSignal.timeout(5000) }
    );
    const d = await r.json();
    const c = d.current;
    const codes: Record<number, string> = {
      0: '☀️ Bilkul saaf', 1: '🌤️ Mostly Clear', 2: '⛅ Thoda badal',
      3: '☁️ Cloudy', 45: '🌫️ Fog', 61: '🌧️ Baarish', 63: '🌧️ Heavy Rain',
      80: '🌦️ Shower', 95: '⛈️ Aandhi', 71: '❄️ Snow',
    };
    const desc = codes[c?.weathercode] || '🌡️';
    const maxT = Math.round(d.daily?.temperature_2m_max?.[0] || 0);
    const minT = Math.round(d.daily?.temperature_2m_min?.[0] || 0);
    const rainChance = d.daily?.precipitation_probability_max?.[0] || 0;
    return `${desc} ${Math.round(c?.temperature_2m)}°C (${minT}°-${maxT}°)${rainChance > 50 ? ` | 🌧️ Baarish ${rainChance}%` : ''}`;
  } catch {
    return '🌡️ Weather unavailable';
  }
}

async function getNewsHeadlines(): Promise<string> {
  try {
    const r = await fetch(
      'https://news.google.com/rss/search?q=India&hl=hi&gl=IN&ceid=IN:hi',
      { signal: AbortSignal.timeout(6000) }
    );
    const xml = await r.text();
    const titles = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)].slice(1, 4);
    return titles.map((m, i) => `${i + 1}. ${m[1]}`).join('\n');
  } catch {
    return 'News unavailable';
  }
}

async function generateAIBriefing(weather: string, news: string, hour: number): Promise<string> {
  const greeting = hour < 12 ? 'Subah ki salaam' : 'Shaam ki salaam';
  const prompt = `You are JARVIS. Generate a short ${hour < 12 ? 'morning' : 'evening'} briefing in Hinglish for Prashant from Maihar MP.

Weather: ${weather}
Top news: ${news}

Keep it under 150 words. Be energetic, personal, mention 1 tip or motivation. Start with "${greeting} Prashant bhai!"`;

  if (GROQ_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const d = await r.json();
        return d.choices?.[0]?.message?.content || '';
      }
    } catch {}
  }

  return `${greeting} Prashant bhai! 🌟\n\nMausam: ${weather}\n\nTop khabar:\n${news}\n\nAaj bhi full mast raho! 💪`;
}

async function sendNtfy(title: string, body: string, priority = 'default') {
  if (!NTFY_TOPIC) return;
  try {
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': priority,
        'Tags': priority === 'high' ? 'loudspeaker' : 'bell',
        'Content-Type': 'text/plain',
      },
      body: body.slice(0, 4000),
      signal: AbortSignal.timeout(5000),
    });
  } catch {}
}

async function sendTelegram(text: string) {
  if (!TG_TOKEN || !TG_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: text.slice(0, 4096),
        parse_mode: 'Markdown',
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {}
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current IST hour
  const now = new Date();
  const istHour = (now.getUTCHours() + 5) % 24 + (now.getUTCMinutes() >= 30 ? 1 : 0);
  const tasks: string[] = [];

  // Task 1: Always prefetch and cache weather
  const weather = await getWeather();
  tasks.push(`weather: ${weather}`);

  // Task 2: Morning briefing at 6am IST
  if (istHour === 6) {
    const news = await getNewsHeadlines();
    const briefing = await generateAIBriefing(weather, news, istHour);

    await sendNtfy('🌅 JARVIS Morning Brief', briefing, 'high');
    await sendTelegram(`🌅 *Morning Brief*\n\n${briefing}`);
    tasks.push('morning briefing sent');
  }

  // Task 3: Evening summary at 9pm IST
  if (istHour === 21) {
    const news = await getNewsHeadlines();
    const briefing = await generateAIBriefing(weather, news, istHour);

    await sendNtfy('🌙 JARVIS Evening Brief', briefing);
    await sendTelegram(`🌙 *Evening Brief*\n\n${briefing}`);
    tasks.push('evening briefing sent');
  }

  // Task 4: Reminder nudge at 12pm (noon)
  if (istHour === 12) {
    const msg = `⏰ Dopahar ho gayi Prashant bhai!\n\n✅ Pani piya?\n✅ Lunch kiya?\n✅ Aaj ke targets check kiye?\n\n💪 Kaam mast chal raha hai!`;
    await sendNtfy('⏰ JARVIS Noon Check', msg);
    tasks.push('noon reminder sent');
  }

  return NextResponse.json({
    ok: true,
    hour: istHour,
    tasks,
    timestamp: now.toISOString(),
  });
}
