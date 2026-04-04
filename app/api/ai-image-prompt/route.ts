import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const GROQ = process.env.GROQ_API_KEY;

  if (!GROQ) {
    return NextResponse.json({ enhanced: prompt + ', photorealistic, 8k, detailed, professional' });
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert at writing image generation prompts. Enhance the given prompt to be more detailed, vivid, and specific. Add art style, lighting, quality keywords. Return ONLY the enhanced prompt, nothing else.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const d = await r.json();
      return NextResponse.json({ enhanced: d.choices?.[0]?.message?.content || prompt });
    }
  } catch {}

  return NextResponse.json({ enhanced: prompt + ', photorealistic, cinematic lighting, 8k, ultra detailed' });
}
