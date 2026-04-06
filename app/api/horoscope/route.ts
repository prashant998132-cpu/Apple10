import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sign = searchParams.get('sign')?.toLowerCase() || 'aries';
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' });
  const GROQ = process.env.GROQ_API_KEY;
  if (!GROQ) return NextResponse.json({ sign, date, prediction: `${sign} ke liye aaj ka din productive rahega! ⭐` });
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: `Write a fun daily horoscope for ${sign} for ${date} in Hinglish (Hindi+English mix). Include: mood emoji, love tip, career tip, lucky number. Max 80 words. Be positive and motivating.` }],
        max_tokens: 200, temperature: 0.9,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) { const d = await r.json(); return NextResponse.json({ sign, date, prediction: d.choices?.[0]?.message?.content || '' }); }
  } catch {}
  return NextResponse.json({ sign, date, prediction: `Aaj ka din mast rahega ${sign}! ⭐ Lucky number: ${Math.floor(Math.random() * 9) + 1}` });
}
