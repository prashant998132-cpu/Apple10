import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: 'No Groq key' }, { status: 400 });
  try {
    const formData = await req.formData();
    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: formData,
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return NextResponse.json({ error: 'Whisper failed' }, { status: 500 });
    const d = await r.json();
    return NextResponse.json({ text: d.text || '' });
  } catch {
    return NextResponse.json({ error: 'STT error' }, { status: 500 });
  }
}
