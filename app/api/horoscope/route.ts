import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sign = searchParams.get('sign')?.toLowerCase() || 'aries';
  const date = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', timeZone:'Asia/Kolkata' });

  const GROQ = process.env.GROQ_API_KEY;
  if (!GROQ) {
    return NextResponse.json({ sign, date, prediction: `${sign.charAt(0).toUpperCase()+sign.slice(1)} ke liye aaj ka din productive rahega! ⭐` });
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'user',
          content: `Write a short daily horoscope for ${sign} for ${date} in Hinglish. Include: overall mood, love, career, lucky number. Keep it fun and positive. Max 100 words.`,
        }],
        max_tokens: 200,
        temperature: 0.9,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const d = await r.json();
      return NextResponse.json({ sign, date, prediction: d.choices?.[0]?.message?.content || '' });
    }
  } catch {}

  return NextResponse.json({ sign, date, prediction: `Aaj ka din mast rahega ${sign}! ⭐` });
}
