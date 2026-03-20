'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS POWER INTENTS — v29
// Detects: translate, youtube summarize, URL summarize,
//          code run, math, unit convert, from chat text
// ══════════════════════════════════════════════════════════════

export interface PowerIntent {
  type: 'translate' | 'youtube' | 'url_summarize' | 'math' | 'unit_convert' | 'code_explain' | 'define';
  data: Record<string, string>;
}

// Language names to codes
const LANG_NAMES: Record<string, string> = {
  hindi: 'hi', english: 'en', french: 'fr', german: 'de', spanish: 'es',
  arabic: 'ar', chinese: 'zh', japanese: 'ja', korean: 'ko', urdu: 'ur',
  bengali: 'bn', tamil: 'ta', telugu: 'te', marathi: 'mr', gujarati: 'gu',
  punjabi: 'pa', kannada: 'kn', portuguese: 'pt', russian: 'ru', italian: 'it',
  angrezi: 'en', hindi: 'hi', japan: 'ja', china: 'zh', korea: 'ko',
};

function getLangCode(name: string): string {
  const n = name.toLowerCase().trim();
  return LANG_NAMES[n] || n.slice(0, 2);
}

export function detectPowerIntent(text: string): PowerIntent | null {
  const t = text.trim();
  const tl = t.toLowerCase();

  // ── TRANSLATION ─────────────────────────────────────────────
  // "Hindi mein translate karo: Hello World"
  // "translate to english: नमस्ते"
  // "English mein kaho: यह क्या है"
  // "German: Good morning"
  const translatePatterns = [
    /(?:translate|anuvad|翻译)\s+(?:to|in|mein|into|ko)\s+(\w+)\s*[:\-]?\s*(.+)/i,
    /(\w+)\s+(?:mein|में|me|translate|karo|kaho|likho)\s*[:\-]?\s*(.+)/i,
    /(.+)\s+(?:ko|को)\s+(\w+)\s+(?:mein|में|translate)/i,
    /(?:translate|anuvad)\s*[:\-]\s*(.+)\s+(?:to|in|mein)\s+(\w+)/i,
  ];

  for (const p of translatePatterns) {
    const m = t.match(p);
    if (m) {
      // Figure out which group is language and which is text
      const g1 = m[1]?.trim(), g2 = m[2]?.trim();
      if (g1 && g2) {
        const isLang1 = Object.keys(LANG_NAMES).some(l => g1.toLowerCase().includes(l)) || g1.length < 15;
        const toLang = isLang1 ? getLangCode(g1) : getLangCode(g2);
        const textToTranslate = isLang1 ? g2 : g1;
        if (textToTranslate && textToTranslate.length > 1) {
          return { type: 'translate', data: { text: textToTranslate, to: toLang, from: 'auto' } };
        }
      }
    }
  }

  // ── YOUTUBE SUMMARIZE ────────────────────────────────────────
  // "summarize this youtube: youtu.be/xxxxx"
  // "youtube video summarize karo: https://..."
  // "is video ka summary: https://youtu.be/..."
  const ytPatterns = [
    /(?:youtube|yt|video)\s+(?:summarize|summary|batao|explain|samjhao)\s*[:\-]?\s*(https?:\/\/\S+|[a-zA-Z0-9_-]{11})/i,
    /(?:summarize|summary|batao)\s+(?:this\s+)?(?:youtube|yt|video)\s*[:\-]?\s*(https?:\/\/\S+|[a-zA-Z0-9_-]{11})/i,
    /(?:is\s+video|this\s+video)\s+(?:ka\s+)?(?:summary|summarize|batao)\s*[:\-]?\s*(https?:\/\/\S+)/i,
    /(https?:\/\/(?:youtube\.com\/watch\?v=|youtu\.be\/)\S+)/i,
  ];

  for (const p of ytPatterns) {
    const m = t.match(p);
    if (m?.[1]) {
      const url = m[1].includes('http') ? m[1] : `https://youtube.com/watch?v=${m[1]}`;
      if (tl.includes('summary') || tl.includes('summarize') || tl.includes('batao') || tl.includes('samjhao') || p.source.includes('youtube.com')) {
        return { type: 'youtube', data: { url } };
      }
    }
  }

  // Check for YouTube URLs anywhere in message
  const ytUrlMatch = t.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytUrlMatch && (tl.includes('summary') || tl.includes('summarize') || tl.includes('explain') || tl.includes('batao') || tl.includes('kya hai'))) {
    return { type: 'youtube', data: { url: ytUrlMatch[0] } };
  }

  // ── URL SUMMARIZE ─────────────────────────────────────────────
  // "summarize this: https://example.com"
  // "is article ka summary: https://..."
  // "https://... kya likha hai"
  const urlMatch = t.match(/https?:\/\/(?!(?:youtube|youtu))[^\s]+/i);
  if (urlMatch && (
    tl.includes('summarize') || tl.includes('summary') || tl.includes('batao') ||
    tl.includes('kya likha') || tl.includes('read') || tl.includes('padho') ||
    tl.includes('explain') || tl.includes('article') || tl.includes('news')
  )) {
    return { type: 'url_summarize', data: { url: urlMatch[0] } };
  }

  // ── MATH ─────────────────────────────────────────────────────
  // "calculate 15% of 5000", "15 * 23 + 7 kya hai"
  const mathMatch = t.match(/(?:calculate|calc|hisab|compute|solve)\s+(.+)/i)
    || t.match(/^([\d\s\+\-\*\/\%\^\(\)\.]+)\s*(?:=\?|kya hai|=|kitna)$/i);
  if (mathMatch?.[1]) {
    const expr = mathMatch[1].trim();
    if (expr.match(/[\d\+\-\*\/\%\^\(\)]/)) {
      return { type: 'math', data: { expression: expr } };
    }
  }

  // % calculation
  const pctMatch = t.match(/(\d+(?:\.\d+)?)\s*%\s+(?:of|ka|of)\s+(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]), base = parseFloat(pctMatch[2]);
    const result = (pct / 100) * base;
    return { type: 'math', data: { expression: `${pct}% of ${base}`, result: String(result) } };
  }

  // ── UNIT CONVERT ─────────────────────────────────────────────
  // "convert 5 km to miles", "100 USD to INR", "72°F to Celsius"
  const unitMatch = t.match(/(?:convert|badlo|kitna hai)?\s*(\d+(?:\.\d+)?)\s*([a-z°$₹€£¥]+)\s+(?:to|se|mein|into|=)\s+([a-z°$₹€£¥]+)/i);
  if (unitMatch) {
    return { type: 'unit_convert', data: { value: unitMatch[1], from: unitMatch[2], to: unitMatch[3] } };
  }

  // ── DEFINE / MEANING ─────────────────────────────────────────
  // "define serendipity", "what is the meaning of ephemeral"
  const defineMatch = t.match(/^(?:define|meaning of|what does .+ mean|matlab kya hai|kya matlab)\s+["']?(\w+)["']?/i);
  if (defineMatch) {
    return { type: 'define', data: { word: defineMatch[1] } };
  }

  return null;
}

// ── Handlers for each power intent ───────────────────────────

export async function handlePowerIntent(intent: PowerIntent): Promise<string> {
  switch (intent.type) {
    case 'translate': {
      const { text, to, from } = intent.data;
      try {
        const r = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, to, from }),
        });
        const d = await r.json();
        if (d.translated) {
          const langNames: Record<string, string> = { hi: 'Hindi', en: 'English', fr: 'French', de: 'German', es: 'Spanish', ar: 'Arabic', ja: 'Japanese', zh: 'Chinese', ko: 'Korean', ur: 'Urdu' };
          const toLang = langNames[to] || to.toUpperCase();
          return `🌐 **Translation → ${toLang}:**\n\n${d.translated}\n\n_via ${d.provider}_`;
        }
      } catch {}
      return '❌ Translation fail ho gaya. Dobara try karo.';
    }

    case 'youtube': {
      const { url } = intent.data;
      try {
        const r = await fetch('/api/youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const d = await r.json();
        if (d.summary) {
          return `▶️ **${d.title || 'YouTube Video'}**\n\n${d.summary}\n\n🔗 ${d.watchUrl || url}`;
        }
      } catch {}
      return '❌ YouTube video summarize nahi ho paya.';
    }

    case 'url_summarize': {
      const { url } = intent.data;
      try {
        const r = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const d = await r.json();
        if (d.summary) {
          return `🔗 **${url}**\n\n${d.summary}\n\n_via ${d.provider}_`;
        }
      } catch {}
      return '❌ URL summarize nahi ho paya.';
    }

    case 'math': {
      const { expression, result } = intent.data;
      if (result) return `🔢 **${expression} = ${result}**`;
      try {
        const val = Function('"use strict"; return (' + expression + ')')();
        return `🔢 **${expression} = ${val}**`;
      } catch {
        return `❌ Math expression samajh nahi aaya: "${expression}"`;
      }
    }

    case 'unit_convert': {
      const { value, from, to } = intent.data;
      const v = parseFloat(value);
      const f = from.toLowerCase(), t2 = to.toLowerCase();

      // Common conversions
      const conversions: Record<string, Record<string, number>> = {
        km: { mile: 0.621371, m: 1000, ft: 3280.84 },
        mile: { km: 1.60934, m: 1609.34 },
        kg: { lb: 2.20462, g: 1000, oz: 35.274 },
        lb: { kg: 0.453592, g: 453.592 },
        celsius: { fahrenheit: (v * 9/5) + 32, kelvin: v + 273.15 },
        fahrenheit: { celsius: (v - 32) * 5/9 },
        l: { ml: 1000, gallon: 0.264172, cup: 4.22675 },
        ml: { l: 0.001, oz: 0.033814 },
        usd: { inr: 83.5, eur: 0.92, gbp: 0.79 },
        inr: { usd: 0.012, eur: 0.011, gbp: 0.0095 },
        eur: { usd: 1.09, inr: 90.5, gbp: 0.86 },
      };

      const factor = conversions[f]?.[t2];
      if (factor !== undefined) {
        const result = f === 'celsius' && (t2 === 'fahrenheit' || t2 === 'kelvin')
          ? conversions.celsius[t2] : v * factor;
        return `📐 **${v} ${from} = ${typeof result === 'number' ? result.toFixed(2) : result} ${to}**`;
      }
      return `📐 ${value} ${from} → ${to} conversion available nahi hai. Google pe check karo.`;
    }

    case 'define': {
      const { word } = intent.data;
      try {
        const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (r.ok) {
          const d = await r.json();
          const entry = d[0];
          const phonetic = entry.phonetics?.find((p: any) => p.text)?.text || '';
          const meanings = entry.meanings?.slice(0, 2).map((m: any) =>
            `**${m.partOfSpeech}:** ${m.definitions?.[0]?.definition}`
          ).join('\n') || '';
          return `📖 **${word}** ${phonetic}\n\n${meanings}`;
        }
      } catch {}
      return `📖 "${word}" ka definition nahi mila.`;
    }

    default:
      return '❓ Intent samajh nahi aaya.';
  }
}
