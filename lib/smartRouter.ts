'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS SMART ROUTER — v28
// Har feature ke liye: Best + Alternatives auto-fallback
// Research-backed choices, always free-first
// ══════════════════════════════════════════════════════════════

// ── FEATURE MAP (har feature ke liye providers) ──────────────
export const FEATURE_MAP = {
  // ── AI CHAT ───────────────────────────────────────────────
  chat: {
    description: 'AI text generation',
    providers: [
      { name: 'Groq Llama-3.3-70B', key: 'GROQ_API_KEY',     free: true,  limit: '14,400/day', quality: 5, speed: 5 },
      { name: 'Gemini 2.5 Flash',   key: 'GEMINI_API_KEY',   free: true,  limit: '1M tok/min',  quality: 5, speed: 4 },
      { name: 'Together AI',        key: 'TOGETHER_API_KEY', free: true,  limit: '$25 credits', quality: 4, speed: 4 },
      { name: 'DeepSeek Chat',      key: 'DEEPSEEK_API_KEY', free: true,  limit: 'free credits',quality: 5, speed: 3 },
      { name: 'Cerebras',           key: 'CEREBRAS_API_KEY', free: true,  limit: 'free tier',   quality: 3, speed: 5 },
      { name: 'Mistral Small',      key: 'MISTRAL_API_KEY',  free: true,  limit: 'free tier',   quality: 3, speed: 4 },
      { name: 'Kimi K2 (OR)',       key: 'OPENROUTER_API_KEY', free: true, limit: '1000/day',   quality: 5, speed: 3 },
      { name: 'Gemma-3-27B (OR)',   key: 'OPENROUTER_API_KEY', free: true, limit: 'free',        quality: 3, speed: 3 },
      { name: 'Pollinations',       key: null,               free: true,  limit: 'unlimited',   quality: 3, speed: 3 },
      { name: 'Grok Mini (OR)',     key: 'OPENROUTER_API_KEY', free: true, limit: '100/day',     quality: 4, speed: 4, note: 'xAI Grok 3 mini' },
      { name: 'Cohere Cmd R+ (OR)', key: 'OPENROUTER_API_KEY', free: true, limit: 'free',          quality: 4, speed: 3, note: 'Cohere via OR' },
    ],
  },

  // ── TTS (Text to Speech) ──────────────────────────────────
  tts: {
    description: 'Text to speech / voice',
    providers: [
      { name: 'Pollinations TTS',   key: null,               free: true,  limit: 'unlimited',   quality: 3, speed: 4, note: 'No key needed' },
      { name: 'ElevenLabs',        key: 'ELEVENLABS_API_KEY', free: true, limit: '10K chars/mo', quality: 5, speed: 4, note: 'Best quality' },
      { name: 'Fish Audio (OpenAudio)', key: 'FISH_API_KEY', free: false, limit: 'paid',         quality: 5, speed: 5, note: '#1 TTS arena' },
      { name: 'HuggingFace TTS',   key: 'HUGGINGFACE_API_KEY', free: true, limit: 'free tier',  quality: 3, speed: 2, note: 'Multiple models' },
      { name: 'Web Speech API',    key: null,               free: true,  limit: 'unlimited',   quality: 2, speed: 5, note: 'Browser built-in' },
      { name: 'Google TTS (gTTS)', key: null,               free: true,  limit: 'unlimited',   quality: 3, speed: 4, note: 'translate.google.com' },
    ],
  },

  // ── IMAGE GENERATION ──────────────────────────────────────
  image: {
    description: 'AI image generation',
    providers: [
      { name: 'Pollinations FLUX',          key: null,               free: true, limit: 'unlimited', quality: 4, speed: 4, note: 'Best free, no key' },
      { name: 'Pollinations FLUX-Realism',  key: null,               free: true, limit: 'unlimited', quality: 5, speed: 3, note: 'Best for photos' },
      { name: 'Pollinations FLUX-Anime',    key: null,               free: true, limit: 'unlimited', quality: 4, speed: 3, note: 'Anime style' },
      { name: 'Pollinations FLUX-3D',       key: null,               free: true, limit: 'unlimited', quality: 4, speed: 3, note: '3D renders' },
      { name: 'HuggingFace SDXL',           key: 'HUGGINGFACE_API_KEY', free: true, limit: 'free tier', quality: 4, speed: 2, note: 'Stable Diffusion XL' },
      { name: 'HuggingFace Flux',           key: 'HUGGINGFACE_API_KEY', free: true, limit: 'free tier', quality: 5, speed: 2, note: 'FLUX.1-dev on HF' },
      { name: 'Together FLUX.1',            key: 'TOGETHER_API_KEY', free: true, limit: '$25 credits', quality: 5, speed: 4, note: 'Fast FLUX' },
    ],
  },

  // ── WEATHER ───────────────────────────────────────────────
  weather: {
    description: 'Weather data',
    providers: [
      { name: 'Open-Meteo',        key: null,                free: true, limit: 'unlimited',    quality: 5, speed: 5, note: 'No key, best free' },
      { name: 'wttr.in',           key: null,                free: true, limit: 'unlimited',    quality: 3, speed: 4, note: 'Simple, no key' },
      { name: 'met.no',            key: null,                free: true, limit: 'unlimited',    quality: 5, speed: 4, note: 'Norwegian met, accurate' },
      { name: 'OpenWeatherMap',    key: 'OPENWEATHER_API_KEY', free: true, limit: '1000/day',   quality: 4, speed: 4, note: 'Free 1K calls/day' },
      { name: 'WeatherAPI',        key: 'WEATHERAPI_KEY',    free: true, limit: '1M/month',     quality: 4, speed: 4, note: 'Very generous free tier' },
      { name: 'Tomorrow.io',       key: 'TOMORROW_API_KEY',  free: true, limit: '500/day',      quality: 5, speed: 4, note: 'Hyperlocal forecasts' },
    ],
  },

  // ── NEWS ──────────────────────────────────────────────────
  news: {
    description: 'News fetching',
    providers: [
      { name: 'DuckDuckGo News',   key: null,                free: true, limit: 'unlimited',    quality: 3, speed: 5, note: 'No key' },
      { name: 'NewsData.io',       key: 'NEWSDATA_API_KEY',  free: true, limit: '200/day',      quality: 4, speed: 4, note: 'Free 200/day' },
      { name: 'GNews',             key: 'GNEWS_API_KEY',     free: true, limit: '100/day',      quality: 4, speed: 4, note: 'Free 100/day' },
      { name: 'NYT RSS',           key: null,                free: true, limit: 'unlimited',    quality: 4, speed: 4, note: 'RSS, no key' },
      { name: 'Google News RSS',   key: null,                free: true, limit: 'unlimited',    quality: 4, speed: 4, note: 'RSS, no key' },
      { name: 'TheNewsAPI',        key: 'THENEWS_API_KEY',   free: true, limit: '100/day',      quality: 4, speed: 4, note: 'Free 100/day' },
    ],
  },

  // ── SEARCH ────────────────────────────────────────────────
  search: {
    description: 'Web/knowledge search',
    providers: [
      { name: 'DuckDuckGo Instant', key: null,               free: true, limit: 'unlimited',    quality: 3, speed: 5, note: 'No key, instant answers' },
      { name: 'Wikipedia API',      key: null,               free: true, limit: 'unlimited',    quality: 4, speed: 4, note: 'No key, deep info' },
      { name: 'Brave Search',       key: 'BRAVE_API_KEY',    free: true, limit: '2000/month',   quality: 5, speed: 4, note: 'Best free web search' },
      { name: 'Serper',             key: 'SERPER_API_KEY',   free: true, limit: '2500 credits', quality: 5, speed: 5, note: 'Google results' },
      { name: 'Bing Search',        key: 'BING_API_KEY',     free: true, limit: '1000/month',   quality: 4, speed: 4, note: 'MS free tier' },
    ],
  },

  // ── FINANCE ───────────────────────────────────────────────
  finance: {
    description: 'Stock/crypto prices',
    providers: [
      { name: 'CoinGecko',          key: null,               free: true, limit: '30/min',       quality: 5, speed: 4, note: 'Best crypto, no key' },
      { name: 'Yahoo Finance',      key: null,               free: true, limit: 'unlimited',    quality: 5, speed: 4, note: 'Stocks, no key' },
      { name: 'NSE India',          key: null,               free: true, limit: 'unlimited',    quality: 5, speed: 4, note: 'Indian stocks, no key' },
      { name: 'ExchangeRate API',   key: null,               free: true, limit: '1500/month',   quality: 4, speed: 5, note: 'Forex, no key' },
      { name: 'Alpha Vantage',      key: 'ALPHA_API_KEY',    free: true, limit: '25/day',       quality: 5, speed: 3, note: 'Free 25/day' },
      { name: 'Finhub',             key: 'FINNHUB_API_KEY',  free: true, limit: '60/min',       quality: 5, speed: 4, note: 'Real-time, free' },
    ],
  },

  // ── STT (Speech to Text) ──────────────────────────────────
  stt: {
    description: 'Speech recognition',
    providers: [
      { name: 'Web Speech API hi-IN', key: null,             free: true, limit: 'unlimited',    quality: 3, speed: 5, note: 'Browser, Hindi' },
      { name: 'Web Speech API en-IN', key: null,             free: true, limit: 'unlimited',    quality: 3, speed: 5, note: 'Browser, English' },
      { name: 'Groq Whisper',          key: 'GROQ_API_KEY',  free: true, limit: 'free tier',    quality: 5, speed: 5, note: 'Fastest Whisper' },
      { name: 'OpenAI Whisper (HF)',   key: 'HUGGINGFACE_API_KEY', free: true, limit: 'free', quality: 5, speed: 3, note: 'Best accuracy' },
    ],
  },
};

// ── Get available providers for a feature ────────────────────
export function getProviders(feature: keyof typeof FEATURE_MAP) {
  return FEATURE_MAP[feature]?.providers || [];
}

// ── Check which providers are configured (have env var set) ─
export function getAvailableProviders(feature: keyof typeof FEATURE_MAP, env: Record<string, string | undefined>) {
  return FEATURE_MAP[feature]?.providers.filter(p => !p.key || env[p.key]) || [];
}

// ── Get feature summary for chat ─────────────────────────────
export function getSystemCapabilities() {
  const lines: string[] = [];
  for (const [feat, data] of Object.entries(FEATURE_MAP)) {
    const free = data.providers.filter(p => p.free);
    const noKey = free.filter(p => !p.key);
    lines.push(`${feat}: ${noKey.length} no-key + ${free.length - noKey.length} free-with-key providers`);
  }
  return lines.join('\n');
}
