import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, prompt } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 });
    }

    const userPrompt = prompt || 'Yeh image mein kya hai? Detail mein batao.';

    // ── 1. Gemini Vision (best, free) ──
    const geminiKey = process.env.GEMINI_API_KEY || '';
    if (geminiKey) {
      try {
        const isVideo = mimeType?.startsWith('video/');
        const isPdf = mimeType === 'application/pdf';

        // For PDFs use text extraction approach
        if (isPdf) {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    {
                      inline_data: {
                        mime_type: 'application/pdf',
                        data: imageBase64,
                      }
                    },
                    { text: userPrompt + ' PDF ka pura content summarize karo.' }
                  ]
                }],
                generationConfig: { maxOutputTokens: 2000 }
              }),
              signal: AbortSignal.timeout(25000),
            }
          );
          if (r.ok) {
            const d = await r.json();
            const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return NextResponse.json({ text, source: 'gemini-pdf' });
          }
        }

        // Image/video vision
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: userPrompt },
                  {
                    inline_data: {
                      mime_type: mimeType || 'image/jpeg',
                      data: imageBase64,
                    }
                  }
                ]
              }],
              generationConfig: { maxOutputTokens: 1500 }
            }),
            signal: AbortSignal.timeout(20000),
          }
        );
        if (r.ok) {
          const d = await r.json();
          const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return NextResponse.json({ text, source: 'gemini-vision' });
        }
      } catch (e: any) {
        console.warn('[vision] Gemini failed:', e.message?.slice(0, 80));
      }
    }

    // ── 2. OpenRouter vision fallback ──
    const orKey = process.env.OPENROUTER_API_KEY || '';
    if (orKey && !mimeType?.includes('pdf')) {
      try {
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${orKey}` },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-exp:free',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                { type: 'image_url', image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` } }
              ]
            }],
            max_tokens: 1000,
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (r.ok) {
          const d = await r.json();
          const text = d.choices?.[0]?.message?.content;
          if (text) return NextResponse.json({ text, source: 'openrouter-vision' });
        }
      } catch {}
    }

    return NextResponse.json(
      { error: 'Vision API unavailable. GEMINI_API_KEY set karo Settings mein.' },
      { status: 503 }
    );
  } catch (e: any) {
    console.error('[vision] crash:', e.message);
    return NextResponse.json(
      { error: 'Vision API crash: ' + (e.message || 'unknown') },
      { status: 500 }
    );
  }
}
