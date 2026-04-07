// JARVIS Daily Morning Digest — Auto via Vercel Cron
// Add to vercel.json: {"crons":[{"path":"/api/cron","schedule":"0 3 * * *"}]}
// (3 AM UTC = 8:30 AM IST)

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if(process.env.CRON_SECRET && secret!==process.env.CRON_SECRET){
    return NextResponse.json({error:'Unauthorized'},{status:401});
  }

  const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID    = process.env.TELEGRAM_CHAT_ID;
  const GROQ_KEY   = process.env.GROQ_API_KEY;

  if(!BOT_TOKEN||!CHAT_ID) return NextResponse.json({ok:false,reason:'No telegram config'});

  let digest = `🌅 *Good Morning! JARVIS Daily Digest*\n${new Date().toLocaleDateString('hi-IN',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Kolkata'})}\n\n`;

  // Weather
  try {
    const w = await fetch('https://api.open-meteo.com/v1/forecast?latitude=24.53&longitude=81.3&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&timezone=Asia/Kolkata&forecast_days=1',{signal:AbortSignal.timeout(5000)});
    if(w.ok){
      const d=await w.json(); const c=d.current;
      const wc=(n:number)=>n<=1?'☀️ Saaf':n<=3?'⛅ Badal':n<=67?'🌧️ Baarish':'⛈️ Toofan';
      digest+=`🌤️ *Aaj ka Mausam (Maihar):*\n${Math.round(c.temperature_2m)}°C | ${wc(c.weathercode)} | Humidity: ${c.relative_humidity_2m}%\n\n`;
    }
  } catch {}

  // Motivational quote
  if(GROQ_KEY){
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${GROQ_KEY}`},
        body:JSON.stringify({model:'llama-3.1-8b-instant',messages:[{role:'user',content:'Give me one powerful motivational quote in Hinglish. Just the quote. Max 2 lines.'}],max_tokens:80,temperature:0.9}),
        signal:AbortSignal.timeout(8000),
      });
      if(r.ok){ const d=await r.json(); const q=d.choices?.[0]?.message?.content; if(q) digest+=`💡 *Quote of the Day:*\n_${q}_\n\n`; }
    } catch {}
  }

  // NEET countdown
  const neetDate = new Date('2026-05-03T00:00:00+05:30');
  const neetDiff = neetDate.getTime() - Date.now();
  if (neetDiff > 0) {
    const daysLeft = Math.ceil(neetDiff / 86400000);
    digest += `🎯 *NEET 2026 Countdown:* ${daysLeft} din bache!\nHar din count karta hai! 💪\n\n`;
  }
  digest+=`📱 JARVIS: apple10.vercel.app\n/digest for full briefing`;

  // Send to Telegram
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({chat_id:CHAT_ID,text:digest,parse_mode:'Markdown',disable_web_page_preview:true}),
  });

  return NextResponse.json({ok:true,sent:true,time:new Date().toISOString()});
}