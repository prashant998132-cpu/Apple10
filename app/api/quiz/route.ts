import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { topic, difficulty = 'medium', count = 5 } = await req.json();
  const GROQ = process.env.GROQ_API_KEY;
  const GEMINI = process.env.GEMINI_API_KEY;

  const sysPrompt = `Generate ${count} multiple choice questions about "${topic}" at ${difficulty} difficulty.
Return ONLY valid JSON array: [{"q":"question","opts":["A","B","C","D"],"ans":"A","explanation":"why"}]`;

  try {
    let text = '';

    if (GROQ) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: sysPrompt }],
          max_tokens: 1500,
          temperature: 0.5,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (r.ok) {
        const d = await r.json();
        text = d.choices?.[0]?.message?.content || '';
      }
    }

    if (!text && GEMINI) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: sysPrompt + ' Return only valid JSON array.' }] }],
          generationConfig: { maxOutputTokens: 1500, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (r.ok) {
        const d = await r.json();
        text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
    }

    // Parse JSON
    const clean = text.replace(/```json|```/g, '').trim();
    let questions = JSON.parse(clean);
    if (!Array.isArray(questions)) {
      // Handle {questions:[...]} format
      questions = questions.questions || questions.quiz || Object.values(questions)[0];
    }

    return NextResponse.json({ questions: questions.slice(0, count) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
