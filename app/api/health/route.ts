import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const start = Date.now();

  const providers = {
    groq:       !!process.env.GROQ_API_KEY,
    gemini:     !!process.env.GEMINI_API_KEY,
    anthropic:  !!process.env.ANTHROPIC_API_KEY,
    cerebras:   !!process.env.CEREBRAS_API_KEY,
    together:   !!process.env.TOGETHER_API_KEY,
    deepseek:   !!process.env.DEEPSEEK_API_KEY,
    mistral:    !!process.env.MISTRAL_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    xai:        !!process.env.XAI_API_KEY,
    cohere:     !!process.env.COHERE_API_KEY,
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
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    alpha:      !!process.env.ALPHA_API_KEY,
  };

  const activeProviders = Object.values(providers).filter(Boolean).length;
  const activeTools = Object.values(tools).filter(Boolean).length;
  const totalProviders = Object.keys(providers).length;
  const totalTools = Object.keys(tools).length;

  // System metrics
  const memUsage = process.memoryUsage ? process.memoryUsage() : null;
  const responseTime = Date.now() - start;

  // Score calculation
  const providerScore = Math.round((activeProviders / totalProviders) * 100);
  const toolScore = Math.round((activeTools / totalTools) * 100);
  const overallScore = Math.round((providerScore + toolScore) / 2);

  return NextResponse.json({
    status:    'ok',
    version:   'JARVIS v45',
    build:     'April 2026',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime ? Math.round(process.uptime()) : null,
    responseTime: responseTime + 'ms',
    environment: process.env.NODE_ENV || 'production',
    providers,
    tools,
    score: {
      providers:  `${activeProviders}/${totalProviders}`,
      tools:      `${activeTools}/${totalTools}`,
      providerPct: providerScore + '%',
      toolPct:     toolScore + '%',
      overall:     overallScore + '%',
      grade: overallScore >= 80 ? 'A' : overallScore >= 60 ? 'B' : overallScore >= 40 ? 'C' : 'D',
    },
    memory: memUsage ? {
      heapUsed:  Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss:       Math.round(memUsage.rss / 1024 / 1024) + 'MB',
    } : null,
    features: {
      streaming:      true,
      parallelRace:   true,
      toolEngine:     true,
      voiceSupport:   true,
      pwaInstallable: true,
      deepMode:       !!process.env.GEMINI_API_KEY,
      thinkMode:      !!(process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY),
      imageGen:       true,
      codeRunner:     true,
      multiProvider:  activeProviders >= 3,
    },
    models: {
      flash:  'gemini-2.5-flash / groq-llama-3.3-70b / cerebras',
      think:  'claude-sonnet-4-6 / deepseek-r1 / groq-r1',
      deep:   'gemini-2.5-pro / claude-sonnet-4-6',
      grok:   'x-ai/grok-3-mini-beta (via OpenRouter)',
    },
  });
}
