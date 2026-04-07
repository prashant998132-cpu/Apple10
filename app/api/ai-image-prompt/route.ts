import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
export async function POST(req: NextRequest) {
  const { prompt, style = 'photorealistic' } = await req.json();
  const GROQ = process.env.GROQ_API_KEY;
  const styleGuide: Record<string, string> = {
    photorealistic: 'photorealistic, 8k, DSLR, sharp focus, natural lighting',
    anime: 'anime style, vibrant colors, Studio Ghibli, detailed linework',
    cinematic: 'cinematic, movie still, anamorphic lens, dramatic lighting, film grain',
    watercolor: 'watercolor painting, soft edges, artistic, flowing colors',
    cyberpunk: 'cyberpunk, neon lights, dystopian, rain, futuristic city',
    minimalist: 'minimalist, clean, simple, white background, elegant',
  };
  const suffix = styleGuide[style] || styleGuide.photorealistic;
  if (!GROQ) return NextResponse.json({ enhanced: `${prompt}, ${suffix}` });
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: `You are an expert image prompt engineer for ${style} style. Enhance the prompt with specific details about lighting, composition, colors, mood. End with: ${suffix}. Return ONLY the enhanced prompt, nothing else. Max 150 words.` },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200, temperature: 0.8,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) { const d = await r.json(); return NextResponse.json({ enhanced: d.choices?.[0]?.message?.content || `${prompt}, ${suffix}` }); }
  } catch {}
  return NextResponse.json({ enhanced: `${prompt}, ${suffix}` });
}
