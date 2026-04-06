import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const maxDuration = 30;
export async function POST(req: NextRequest) {
  const { topic, difficulty = 'medium', count = 5 } = await req.json();
  const GROQ = process.env.GROQ_API_KEY;
  const GEMINI = process.env.GEMINI_API_KEY;
  const prompt = `Generate ${count} MCQ questions about "${topic}" at ${difficulty} difficulty. Return ONLY a JSON array like: [{"q":"question text","opts":["A) option1","B) option2","C) option3","D) option4"],"ans":"A) option1","explanation":"brief explanation"}]. No markdown, no extra text.`;
  try {
    let text = '';
    if (GROQ) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.4 }),
        signal: AbortSignal.timeout(25000),
      });
      if (r.ok) { const d = await r.json(); text = d.choices?.[0]?.message?.content || ''; }
    }
    if (!text && GEMINI) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 2000 } }),
        signal: AbortSignal.timeout(25000),
      });
      if (r.ok) { const d = await r.json(); text = d.candidates?.[0]?.content?.parts?.[0]?.text || ''; }
    }
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('No JSON array found');
    const arr = JSON.parse(clean.slice(start, end + 1));
    return NextResponse.json({ questions: arr.slice(0, count) });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
