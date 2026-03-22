import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text, lang = 'hi-IN', voice = 'auto' } = await req.json();
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

  const clean = text.replace(/[*#`]/g, '').substring(0, 500);

  // 1. Google Cloud TTS (1M chars/month FREE — WaveNet Hindi)
  const gcpKey = process.env.GOOGLE_TTS_KEY || '';
  if (gcpKey) {
    try {
      const voiceName = lang.startsWith('hi') ? 'hi-IN-Wavenet-D' : 'en-IN-Wavenet-A';
      const r = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${gcpKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: clean },
            voice: { languageCode: lang, name: voiceName },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95, pitch: 0 },
          }),
          signal: AbortSignal.timeout(8000),
        }
      );
      if (r.ok) {
        const d = await r.json();
        return NextResponse.json({ audio: d.audioContent, format: 'mp3', source: 'google-wavenet' });
      }
    } catch {}
  }

  // 2. ElevenLabs (10K chars/month free)
  const elKey = process.env.ELEVENLABS_API_KEY || '';
  if (elKey) {
    try {
      const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': elKey },
        body: JSON.stringify({
          text: clean,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const buf = await r.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        return NextResponse.json({ audio: b64, format: 'mp3', source: 'elevenlabs' });
      }
    } catch {}
  }

  // 3. HuggingFace TTS (free)
  const hfKey = process.env.HUGGINGFACE_API_KEY || '';
  if (hfKey) {
    try {
      const r = await fetch(
        'https://api-inference.huggingface.co/models/facebook/mms-tts-hin',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: clean }),
          signal: AbortSignal.timeout(15000),
        }
      );
      if (r.ok) {
        const buf = await r.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        return NextResponse.json({ audio: b64, format: 'wav', source: 'huggingface-mms' });
      }
    } catch {}
  }

  // 4. Fallback: tell client to use browser TTS
  return NextResponse.json({
    fallback: true,
    text: clean,
    message: 'Browser TTS use karo',
    source: 'browser',
  });
}
