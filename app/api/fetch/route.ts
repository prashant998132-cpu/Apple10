import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const maxDuration = 30;

async function fetchPage(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JARVIS/1.0)', 'Accept': 'text/html,text/plain' },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    .trim().slice(0, 8000);
}

export async function POST(req: NextRequest) {
  try {
    const { url, question = 'Is page ka summary do Hinglish mein. Key points batao.' } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });
    try { new URL(url); } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }

    const pageText = await fetchPage(url);
    if (!pageText || pageText.length < 50) return NextResponse.json({ error: 'Page content nahi mili' }, { status: 422 });

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const prompt = `URL: ${url}\n\nPage Content:\n${pageText}\n\nUser ka sawal: ${question}\n\nHinglish mein jawab do.`;

    if (groqKey) {
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: 'Tu JARVIS hai. URL se content padhke user ke sawal ka jawab Hinglish mein do.' }, { role: 'user', content: prompt }], max_tokens: 1000 }),
          signal: AbortSignal.timeout(15000),
        });
        if (r.ok) { const d = await r.json(); const text = d.choices?.[0]?.message?.content; if (text) return NextResponse.json({ text, url }); }
      } catch {}
    }
    if (geminiKey) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1000 } }),
          signal: AbortSignal.timeout(15000),
        });
        if (r.ok) { const d = await r.json(); const text = d.candidates?.[0]?.content?.parts?.[0]?.text; if (text) return NextResponse.json({ text, url }); }
      } catch {}
    }
    return NextResponse.json({ error: 'AI unavailable' }, { status: 503 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
