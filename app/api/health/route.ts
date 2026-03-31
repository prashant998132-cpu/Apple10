import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    status:    'ok',
    service:   'JARVIS v8',
    timestamp: new Date().toISOString(),
    env: {
      groq:     !!process.env.GROQ_API_KEY,
      gemini:   !!process.env.GEMINI_API_KEY,
      telegram: !!process.env.TELEGRAM_BOT_TOKEN,
    },
  });
}
