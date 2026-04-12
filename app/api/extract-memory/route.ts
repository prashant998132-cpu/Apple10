import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const maxDuration = 20;

export async function POST(req: NextRequest) {
  try {
    const { userMsg, aiResponse, existingMemories = [] } = await req.json();
    if (!userMsg || !aiResponse) return NextResponse.json({ facts: [] });

    const GROQ = process.env.GROQ_API_KEY;
    const GEMINI = process.env.GEMINI_API_KEY;

    const prompt = `Extract personal facts about the USER from this conversation. Return ONLY a JSON array of strings. Max 5 facts. Only extract clear personal info: name, age, location, goals, exam prep, job, hobbies, family, preferences.

User: "${userMsg.slice(0, 300)}"
AI: "${aiResponse.slice(0, 200)}"
Already known: ${existingMemories.slice(0, 5).join(', ') || 'nothing yet'}

Rules:
- Only facts about the USER, not general facts
- Phrase as "User ka naam X hai" / "User Y mein rehta hai" etc.
- Skip if already in "Already known"
- Return [] if nothing personal found

Return ONLY valid JSON array, no other text.`;

    if (GROQ) {
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 250, temperature: 0.1,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const d = await r.json();
          const text = (d.choices?.[0]?.message?.content || '[]').trim().replace(/```json|```/g, '').trim();
          try {
            const facts = JSON.parse(text);
            if (Array.isArray(facts)) return NextResponse.json({ facts: facts.slice(0, 5) });
          } catch {}
        }
      } catch {}
    }

    if (GEMINI) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 250 },
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (r.ok) {
          const d = await r.json();
          const text = (d.candidates?.[0]?.content?.parts?.[0]?.text || '[]').trim().replace(/```json|```/g, '').trim();
          try {
            const facts = JSON.parse(text);
            if (Array.isArray(facts)) return NextResponse.json({ facts: facts.slice(0, 5) });
          } catch {}
        }
      } catch {}
    }

    return NextResponse.json({ facts: [] });
  } catch {
    return NextResponse.json({ facts: [] });
  }
}
