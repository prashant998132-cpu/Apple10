import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_ID = process.env.TELEGRAM_CHAT_ID;
const GROQ_KEY   = process.env.GROQ_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function tgSend(chatId:string|number, text:string, parseMode='Markdown') {
  if(!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({chat_id:chatId,text:text.slice(0,4096),parse_mode:parseMode,disable_web_page_preview:true}),
  }).catch(()=>{});
}

async function getAIResponse(userText:string): Promise<string> {
  const profileRaw = ''; // Server side — no localStorage
  const sys = `You are JARVIS, a helpful personal AI assistant. Speak in Hinglish (Hindi+English mix). Keep Telegram responses concise — max 3-4 sentences unless asked for more. Be smart, witty, and helpful.`;
  const messages = [{role:'system',content:sys},{role:'user',content:userText}];

  if(GROQ_KEY){
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${GROQ_KEY}`},
        body:JSON.stringify({model:'llama-3.3-70b-versatile',messages,max_tokens:500,temperature:0.7}),
        signal:AbortSignal.timeout(12000),
      });
      if(r.ok){ const d=await r.json(); return d.choices?.[0]?.message?.content||''; }
    } catch {}
  }

  if(GEMINI_KEY){
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{role:'user',parts:[{text:userText}]}],systemInstruction:{parts:[{text:sys}]},generationConfig:{maxOutputTokens:500}}),
        signal:AbortSignal.timeout(15000),
      });
      if(r.ok){ const d=await r.json(); return d.candidates?.[0]?.content?.parts?.[0]?.text||''; }
    } catch {}
  }

  return 'Sorry bhai, abhi AI unavailable hai. Thodi der mein try karo! 🔄';
}

async function getMorningDigest(): Promise<string> {
  const hour = new Date().toLocaleTimeString('hi-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'});
  let digest = `🌅 *Good Morning! JARVIS Daily Digest*\n${new Date().toLocaleDateString('hi-IN',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Kolkata'})}\n\n`;

  // Weather
  try {
    const w = await fetch('https://api.open-meteo.com/v1/forecast?latitude=24.53&longitude=81.3&current=temperature_2m,weathercode,windspeed_10m&timezone=Asia/Kolkata',{signal:AbortSignal.timeout(5000)});
    if(w.ok){ const wd=await w.json(); const c=wd.current; const wc=(code:number)=>code<=1?'☀️ Saaf':code<=3?'⛅ Badal':code<=67?'🌧️ Baarish':'⛈️ Toofan'; digest+=`🌤️ *Mausam:* ${Math.round(c.temperature_2m)}°C — ${wc(c.weathercode)} | Hawa: ${c.windspeed_10m} km/h\n\n`; }
  } catch {}

  // Gold price
  try {
    const g = await fetch(`https://${process.env.VERCEL_URL||'localhost:3000'}/api/gold`,{signal:AbortSignal.timeout(6000)});
    if(g.ok){ const gd=await g.json(); if(gd.gold24k) digest+=`🥇 *Gold 24K:* ₹${gd.gold24k}/gram (${gd.changeDir==='up'?'▲':'▼'}${gd.change})\n\n`; }
  } catch {}

  // Motivational quote from AI
  try {
    const q = await getAIResponse('Give me one short motivational quote in Hinglish. Just the quote, no explanation. 1-2 lines max.');
    if(q) digest+=`💡 *Quote of the day:*\n_${q}_\n\n`;
  } catch {}

  digest+=`🤖 JARVIS ready hai! Chat karo: apple10.vercel.app`;
  return digest;
}

// ── Setup webhook ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('setup');
  if(url==='1'){
    if(!BOT_TOKEN) return NextResponse.json({error:'No bot token'});
    const host = req.headers.get('host')||'';
    const webhookUrl = `https://${host}/api/telegram`;
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({url:webhookUrl,allowed_updates:['message','callback_query']}),
    });
    const d = await r.json();
    return NextResponse.json(d);
  }
  if(url==='digest'){
    // Manual trigger for morning digest
    if(!ALLOWED_ID) return NextResponse.json({error:'No chat ID'});
    const digest = await getMorningDigest();
    await tgSend(ALLOWED_ID, digest);
    return NextResponse.json({ok:true,sent:true});
  }
  return NextResponse.json({status:'JARVIS Telegram Agent v41 active'});
}

// ── Handle incoming messages ───────────────────────────────────
export async function POST(req: NextRequest) {
  if(!BOT_TOKEN) return NextResponse.json({ok:true});
  try {
    const body = await req.json();
    const msg = body.message;
    if(!msg) return NextResponse.json({ok:true});

    const chatId   = msg.chat?.id?.toString();
    const text     = msg.text||'';
    const fromName = msg.from?.first_name||'Bhai';

    // Security: only allow from your chat ID
    if(ALLOWED_ID && chatId!==ALLOWED_ID){
      await tgSend(chatId,`Sorry, tum authorized nahi ho. JARVIS sirf owner ke liye hai. 🔒`);
      return NextResponse.json({ok:true});
    }

    // /start
    if(text==='/start'){
      await tgSend(chatId,`🤖 *JARVIS Active!* Namaste ${fromName}!\n\nMain tumhara personal AI hoon. Kuch bhi pucho:\n• Weather, news, cricket\n• Code likhwao\n• Koi bhi sawal\n\n/digest — Morning briefing\n/help — Commands list`);
      return NextResponse.json({ok:true});
    }

    // /digest — morning briefing
    if(text==='/digest'){
      await tgSend(chatId,'⏳ Digest prepare ho rahi hai...');
      const digest = await getMorningDigest();
      await tgSend(chatId,digest);
      return NextResponse.json({ok:true});
    }

    // /help
    if(text==='/help'){
      await tgSend(chatId,`📋 *JARVIS Commands:*\n\n/start — Hello\n/digest — Morning briefing\n/help — Yeh list\n\nYa seedha kuch bhi type karo — main samajh lunga! 🧠`);
      return NextResponse.json({ok:true});
    }

    // AI response for everything else
    await tgSend(chatId,'💭 Soch raha hoon...');
    const reply = await getAIResponse(text);
    if(reply) await tgSend(chatId,reply);

  } catch(e){
    console.error('Telegram error:',e);
  }
  return NextResponse.json({ok:true});
}