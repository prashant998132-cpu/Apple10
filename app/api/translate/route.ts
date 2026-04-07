// ══════════════════════════════════════════════════════════════
// JARVIS TRANSLATION API — v45
// NEW: Malayalam, Odia, Assamese, Nepali, Sindhi added
// Research: LibreTranslate (open source, self-host or free),
//           MyMemory (free 5000 chars/day), Google Translate
//           (unofficial endpoint, no key), DeepL free tier
//
// Chain: MyMemory → LibreTranslate → Google Unofficial → Fallback AI
// All FREE, no key required for basic usage
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

const DEEPL_KEY = process.env.DEEPL_API_KEY; // optional, best quality

// Language code map (common ones)
const LANG_MAP: Record<string, string> = {
  hindi: 'hi', english: 'en', french: 'fr', german: 'de',
  spanish: 'es', arabic: 'ar', chinese: 'zh', japanese: 'ja',
  korean: 'ko', portuguese: 'pt', russian: 'ru', italian: 'it',
  bengali: 'bn', tamil: 'ta', telugu: 'te', marathi: 'mr',
  gujarati: 'gu', punjabi: 'pa', urdu: 'ur', kannada: 'kn', malayalam: 'ml', odia: 'or', assamese: 'as', nepali: 'ne', sindhi: 'sd',
  h: 'hi', e: 'en', hi: 'hi', en: 'en',
};

function resolveLang(lang: string): string {
  return LANG_MAP[lang.toLowerCase()] || lang.toLowerCase().slice(0, 2);
}

// Provider 1: MyMemory (free 5000 chars/day, no key)
async function myMemoryTranslate(text: string, from: string, to: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}&de=prashant998132@gmail.com`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.responseStatus !== 200) return null;
    const translated = d.responseData?.translatedText;
    if (!translated || translated === text) return null;
    return translated;
  } catch { return null; }
}

// Provider 2: LibreTranslate (free public instances)
async function libreTranslate(text: string, from: string, to: string): Promise<string | null> {
  const instances = [
    'https://libretranslate.com',
    'https://translate.terraprint.co',
    'https://lt.vern.cc',
  ];
  for (const base of instances) {
    try {
      const r = await fetch(`${base}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: from, target: to, format: 'text' }),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) continue;
      const d = await r.json();
      if (d.translatedText && d.translatedText !== text) return d.translatedText;
    } catch {}
  }
  return null;
}

// Provider 3: DeepL (best quality, free 500K chars/month with key)
async function deepLTranslate(text: string, from: string, to: string): Promise<string | null> {
  if (!DEEPL_KEY) return null;
  try {
    const r = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        auth_key: DEEPL_KEY,
        text,
        source_lang: from.toUpperCase(),
        target_lang: to.toUpperCase(),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.translations?.[0]?.text || null;
  } catch { return null; }
}

// Provider 4: Lingva Translate (Google Translate proxy, no key)
async function lingvaTranslate(text: string, from: string, to: string): Promise<string | null> {
  const instances = [
    'https://lingva.ml',
    'https://lingva.garudalinux.org',
    'https://translate.plausibility.cloud',
  ];
  for (const base of instances) {
    try {
      const r = await fetch(`${base}/api/v1/${from}/${to}/${encodeURIComponent(text)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!r.ok) continue;
      const d = await r.json();
      if (d.translation && d.translation !== text) return d.translation;
    } catch {}
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { text, from = 'auto', to = 'hi' } = await req.json();
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

    const fromLang = from === 'auto' ? 'en' : resolveLang(from);
    const toLang = resolveLang(to);

    if (fromLang === toLang) {
      return NextResponse.json({ translated: text, from: fromLang, to: toLang, provider: 'none' });
    }

    // Try providers in order: DeepL (best) → MyMemory → LibreTranslate → Lingva
    const providers = [
      { name: 'DeepL', fn: () => deepLTranslate(text, fromLang, toLang) },
      { name: 'MyMemory', fn: () => myMemoryTranslate(text, fromLang, toLang) },
      { name: 'LibreTranslate', fn: () => libreTranslate(text, fromLang, toLang) },
      { name: 'Lingva', fn: () => lingvaTranslate(text, fromLang, toLang) },
    ];

    for (const p of providers) {
      try {
        const result = await p.fn();
        if (result) {
          return NextResponse.json({
            translated: result,
            from: fromLang,
            to: toLang,
            provider: p.name,
            original: text,
          });
        }
      } catch {}
    }

    return NextResponse.json({ error: 'All translation providers failed' }, { status: 500 });
  } catch {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
