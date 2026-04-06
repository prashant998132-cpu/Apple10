import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const maxDuration = 30;
export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });
  const GROQ = process.env.GROQ_API_KEY;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JARVIS/1.0)' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('Page fetch failed: ' + r.status);
    const html = await r.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);
    if (!GROQ) return NextResponse.json({ summary: text.slice(0, 500) + '...' });
    const ai = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: 'Summarize this webpage in Hinglish in 3-5 bullet points. Be concise.' }, { role: 'user', content: `URL: ${url}\n\nContent: ${text}` }], max_tokens: 400 }),
      signal: AbortSignal.timeout(12000),
    });
    if (ai.ok) { const d = await ai.json(); return NextResponse.json({ summary: d.choices?.[0]?.message?.content || text.slice(0, 300) }); }
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 });
}
