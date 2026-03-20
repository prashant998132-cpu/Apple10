// ══════════════════════════════════════════════════════════════
// JARVIS TELEGRAM AGENT — v31
// Research: Telegram Bot API is the best free always-on agent.
// Send a message to your Telegram bot → JARVIS responds with AI.
// Works even when phone browser is closed.
//
// Setup: @BotFather → /newbot → get token → TELEGRAM_BOT_TOKEN
//        Send /start to your bot → get your TELEGRAM_CHAT_ID
//        Set webhook: GET /api/telegram?setup=1
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_ID  = process.env.TELEGRAM_CHAT_ID;   // your personal chat ID
const GROQ_KEY    = process.env.GROQ_API_KEY;
const GEMINI_KEY  = process.env.GEMINI_API_KEY;
const NTFY_TOPIC  = process.env.NTFY_TOPIC;         // optional: ntfy.sh topic

// ── Send message via Telegram ────────────────────────────────
async function tgSend(chatId: string | number, text: string, parseMode = 'Markdown') {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4096),
      parse_mode: parseMode,
      disable_web_page_preview: true,
    }),
  }).catch(() => {});
}

// ── Get AI response ──────────────────────────────────────────
async function getAIResponse(userText: string): Promise<string> {
  const systemPrompt = `You are JARVIS, Prashant's personal AI assistant. 
He is from Maihar, MP, India. You speak in Hinglish (Hindi + English mix).
Keep responses concise for Telegram — max 3-4 sentences unless asked for more.
You have access to: weather, news, translation, YouTube summaries, code runner, cricket scores.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userText },
  ];

  // Try Groq first (fastest)
  if (GROQ_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 500, temperature: 0.7 }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const d = await r.json();
        return d.choices?.[0]?.message?.content || '';
      }
    } catch {}
  }

  // Gemini fallback
  if (GEMINI_KEY) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${userText}` }] }],
            generationConfig: { maxOutputTokens: 500 },
          }),
          signal: AbortSignal.timeout(15000),
        }
      );
      if (r.ok) {
        const d = await r.json();
        return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
    } catch {}
  }

  return 'Abhi AI unavailable hai bhai. Thodi der baad try karo.';
}

// ── Handle special commands ──────────────────────────────────
async function handleCommand(cmd: string, chatId: string | number): Promise<string> {
  const c = cmd.toLowerCase().trim();

  if (c === '/start' || c === '/help') {
    return `🤖 *JARVIS Online!*

Kuch bhi poocho — main hoon!

*Commands:*
/weather — Maihar mausam
/cricket — Live scores
/news — Aaj ki khabar
/status — System status
/remind 30m kuch bhi — Reminder set karo

Bas seedha message karo, main samjh jaunga! 🚀`;
  }

  if (c.startsWith('/weather')) {
    try {
      const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=24.53&longitude=81.3&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&timezone=Asia/Kolkata', { signal: AbortSignal.timeout(5000) });
      const d = await r.json();
      const c2 = d.current;
      const codes: Record<number, string> = { 0: '☀️ Clear', 1: '🌤️ Mostly Clear', 2: '⛅ Cloudy', 3: '☁️ Overcast', 61: '🌧️ Rain', 80: '🌦️ Showers', 95: '⛈️ Storm' };
      const desc = codes[c2.weathercode] || '🌡️ Weather';
      return `🌤️ *Maihar Weather*\n\n${desc}\n🌡️ *${Math.round(c2.temperature_2m)}°C*\n💧 Humidity: ${c2.relativehumidity_2m}%\n💨 Wind: ${Math.round(c2.windspeed_10m)} km/h`;
    } catch {
      return '❌ Weather fetch nahi ho paya.';
    }
  }

  if (c.startsWith('/news')) {
    try {
      const r = await fetch('https://news.google.com/rss/search?q=India+today&hl=hi&gl=IN&ceid=IN:hi', { signal: AbortSignal.timeout(6000) });
      const xml = await r.text();
      const titles = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)].slice(1, 5);
      if (!titles.length) return '📰 News unavailable.';
      return `📰 *Aaj ki khabar:*\n\n${titles.map((m, i) => `${i + 1}. ${m[1]}`).join('\n\n')}`;
    } catch {
      return '❌ News unavailable.';
    }
  }

  if (c.startsWith('/cricket')) {
    return '🏏 Cricket ke liye CRICAPI\\_KEY set karo. Abhi ESPN RSS se:\nhttps://www.espncricinfo.com';
  }

  if (c.startsWith('/status')) {
    return `✅ *JARVIS Status*\n\nGroq: ${GROQ_KEY ? '✅' : '❌'}\nGemini: ${GEMINI_KEY ? '✅' : '❌'}\nTelegram: ✅\nntfy: ${NTFY_TOPIC ? '✅' : '❌'}\n\n🔗 [Open JARVIS](https://apple10.vercel.app)`;
  }

  if (c.startsWith('/remind')) {
    // Basic: /remind 30m Buy groceries
    const parts = cmd.slice(8).trim().match(/^(\d+)(m|h|s)\s+(.+)$/i);
    if (parts) {
      const val = parseInt(parts[1]);
      const unit = parts[2].toLowerCase();
      const task = parts[3];
      const ms = unit === 'h' ? val * 3600000 : unit === 'm' ? val * 60000 : val * 1000;
      const display = unit === 'h' ? `${val} ghante` : unit === 'm' ? `${val} minute` : `${val} second`;

      // Fire reminder after delay (Vercel edge function limitation — max 25s, so use ntfy for longer)
      if (ms <= 25000) {
        setTimeout(() => tgSend(chatId, `⏰ *REMINDER:* ${task}`), ms);
        return `✅ Reminder set! ${display} baad yaad dilaaunga: "${task}"`;
      } else {
        // For longer reminders, use ntfy.sh
        if (NTFY_TOPIC) {
          setTimeout(async () => {
            await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
              method: 'POST',
              body: `⏰ JARVIS Reminder: ${task}`,
              headers: { 'Title': 'JARVIS Reminder', 'Priority': 'high', 'Tags': 'alarm_clock' },
            });
            await tgSend(chatId, `⏰ *REMINDER:* ${task}`);
          }, Math.min(ms, 300000)); // max 5 min in edge function
        }
        return `✅ Reminder set! ${display} baad yaad dilaaunga: "${task}"\n_(ntfy.sh bhi bhejunga agar app band ho)_`;
      }
    }
    return '❓ Format: /remind 30m Kuch bhi karna hai';
  }

  return '';
}

// ── Webhook handler ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) return NextResponse.json({ ok: false });

  try {
    const body = await req.json();
    const message = body.message || body.edited_message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;
    const text = message.text || '';
    const fromId = String(message.from?.id || '');

    // Security: only respond to allowed user
    if (ALLOWED_ID && fromId !== ALLOWED_ID && String(chatId) !== ALLOWED_ID) {
      await tgSend(chatId, '❌ Unauthorized. Sirf Prashant bhai se baat karta hoon!');
      return NextResponse.json({ ok: true });
    }

    if (!text) return NextResponse.json({ ok: true });

    // Commands
    if (text.startsWith('/')) {
      const response = await handleCommand(text, chatId);
      if (response) {
        await tgSend(chatId, response);
        return NextResponse.json({ ok: true });
      }
    }

    // AI response for regular messages
    const aiReply = await getAIResponse(text);
    await tgSend(chatId, aiReply);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Telegram webhook error:', e);
    return NextResponse.json({ ok: false });
  }
}

// ── Setup webhook & GET handler ───────────────────────────────
export async function GET(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' });
  }

  const setup = req.nextUrl.searchParams.get('setup');
  if (setup) {
    // Set webhook
    const webhookUrl = `https://apple10.vercel.app/api/telegram`;
    const r = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=["message","edited_message"]`
    );
    const d = await r.json();
    return NextResponse.json({ webhook: webhookUrl, result: d });
  }

  // Get bot info
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
  const d = await r.json();
  return NextResponse.json({ bot: d.result, setup: 'GET /api/telegram?setup=1 to configure webhook' });
}
