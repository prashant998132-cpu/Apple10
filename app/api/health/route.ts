import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const providers = {
    groq:       !!process.env.GROQ_API_KEY,
    gemini:     !!process.env.GEMINI_API_KEY,
    anthropic:  !!process.env.ANTHROPIC_API_KEY,
    cerebras:   !!process.env.CEREBRAS_API_KEY,
    together:   !!process.env.TOGETHER_API_KEY,
    deepseek:   !!process.env.DEEPSEEK_API_KEY,
    mistral:    !!process.env.MISTRAL_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
  };
  const tools = {
    telegram:   !!process.env.TELEGRAM_BOT_TOKEN,
    news:       !!process.env.NEWS_API_KEY,
    nasa:       !!process.env.NASA_API_KEY,
    pexels:     !!process.env.PEXELS_API_KEY,
    youtube:    !!process.env.YOUTUBE_API_KEY,
    supabase:   !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    tavily:     !!process.env.TAVILY_API_KEY,
    brave:      !!process.env.BRAVE_API_KEY,
  };
  const activeProviders = Object.values(providers).filter(Boolean).length;
  const activeTools = Object.values(tools).filter(Boolean).length;

  return NextResponse.json({
    status:    'ok',
    version:   'JARVIS v44',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime ? Math.round(process.uptime()) : null,
    providers,
    tools,
    score: {
      providers: activeProviders + '/' + Object.keys(providers).length,
      tools:     activeTools + '/' + Object.keys(tools).length,
    },
  });
}
