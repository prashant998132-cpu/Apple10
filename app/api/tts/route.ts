// ══════════════════════════════════════════════════════════════
// JARVIS TTS API — v28 Multi-Provider
// Research: Fish Audio #1 quality, ElevenLabs premium,
//           Pollinations free, HuggingFace free, gTTS free
//
// Chain (free-first, best-quality):
// 1. ElevenLabs free tier (10K chars/month, best quality)
// 2. Pollinations TTS (no key, decent quality)
// 3. HuggingFace MMS (no key, multilingual)
// 4. gTTS via translate.google.com (no key, always works)
// 5. Fallback URL (browser will use Web Speech API)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
const HF_KEY = process.env.HUGGINGFACE_API_KEY;

// Provider 1: ElevenLabs (best quality, free 10K chars/month)
async function elevenLabsTTS(text: string): Promise<Buffer | null> {
  if (!ELEVEN_KEY) return null;
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch { return null; }
}

// Provider 2: Pollinations TTS (no key needed)
async function pollinationsTTS(text: string): Promise<string | null> {
  try {
    // Pollinations has a TTS endpoint
    const r = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }],
        model: 'openai-audio',
        voice: 'nova',
        stream: false,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) {
      const d = await r.json().catch(() => null);
      if (d?.audio || d?.url) return d.audio || d.url;
    }
    return null;
  } catch { return null; }
}

// Provider 3: HuggingFace MMS-TTS (free, multilingual, Hindi support)
async function huggingFaceTTS(text: string): Promise<Buffer | null> {
  if (!HF_KEY) return null;
  try {
    const r = await fetch(
      'https://api-inference.huggingface.co/models/facebook/mms-tts-hin', // Hindi TTS
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${HF_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text }),
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch { return null; }
}

// Provider 4: Google Translate TTS (no key, always works)
async function googleTTS(text: string, lang = 'hi'): Promise<string> {
  const q = encodeURIComponent(text.slice(0, 200));
  // This returns a direct audio URL
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=${lang}&client=tw-ob`;
}

// Provider 5: HuggingFace Bark (expressive, with emotions)
async function barkTTS(text: string): Promise<Buffer | null> {
  if (!HF_KEY) return null;
  try {
    const r = await fetch(
      'https://api-inference.huggingface.co/models/suno/bark-small',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${HF_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text }),
        signal: AbortSignal.timeout(20000),
      }
    );
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { text, lang = 'hi', voice = 'default' } = await req.json();
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

    const clean = text.replace(/[#*`>\[\]_~]/g, '').trim().slice(0, 500);
    const isHindi = /[\u0900-\u097F]/.test(clean) || lang === 'hi';

    // Try providers in order
    // 1. ElevenLabs (if key available)
    const elevenBuf = await elevenLabsTTS(clean);
    if (elevenBuf) {
      return new Response(elevenBuf, {
        headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Provider': 'ElevenLabs' },
      });
    }

    // 2. HuggingFace Hindi TTS (if Hindi text and key available)
    if (isHindi && HF_KEY) {
      const hfBuf = await huggingFaceTTS(clean);
      if (hfBuf) {
        return new Response(hfBuf, {
          headers: { 'Content-Type': 'audio/wav', 'X-TTS-Provider': 'HuggingFace-MMS' },
        });
      }
    }

    // 3. Google TTS URL (always works, no key)
    const googleUrl = await googleTTS(clean, isHindi ? 'hi' : 'en');
    return NextResponse.json({
      url: googleUrl,
      provider: 'Google TTS',
      note: 'Direct audio URL',
    });

  } catch (e) {
    // Ultimate fallback — return empty so browser uses Web Speech API
    return NextResponse.json({ url: null, provider: 'browser', error: 'All TTS failed' });
  }
}

// GET — for direct audio URL generation
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text') || 'Hello';
  const lang = req.nextUrl.searchParams.get('lang') || 'hi';
  const q = encodeURIComponent(text.slice(0, 200));
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=${lang}&client=tw-ob`;
  return NextResponse.redirect(url);
}
