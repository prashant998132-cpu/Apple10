import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { message, system } = await req.json();
    const GROQ = process.env.GROQ_API_KEY;
    const GEMINI = process.env.GEMINI_API_KEY;

    if (GROQ) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: system || 'Tu JARVIS hai. Hinglish mein baat kar.' },
            { role: 'user', content: message },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const d = await r.json();
        return NextResponse.json({ reply: d.choices?.[0]?.message?.content || '' });
      }
    }

    if (GEMINI) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          systemInstruction: { parts: [{ text: system || 'Tu JARVIS hai.' }] },
          generationConfig: { maxOutputTokens: 300 },
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const d = await r.json();
        return NextResponse.json({ reply: d.candidates?.[0]?.content?.parts?.[0]?.text || '' });
      }
    }

    // Pollinations fallback
    const r = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai', messages: [{ role: 'user', content: message }], max_tokens: 200 }),
      signal: AbortSignal.timeout(15000),
    });
    if (r.ok) {
      const d = await r.json();
      return NextResponse.json({ reply: d.choices?.[0]?.message?.content || 'Sorry, abhi unavailable hai.' });
    }

    return NextResponse.json({ reply: 'Sorry bhai, abhi unavailable hai. Thodi der mein try karo!' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
