// ══════════════════════════════════════════════════════════════
// JARVIS GRAMMAR CHECKER — v45
// Chain: LanguageTool → AI Enhance (Groq/Gemini/Claude) → Fallback
// NEW: Hinglish grammar mode, readability score, plagiarism hint
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

// Provider 1: LanguageTool (free, no key, best quality)
async function languageTool(text: string, lang = 'en-US') {
  try {
    const r = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text: text.slice(0, 20000), language: lang, enabledOnly: 'false' }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return {
      matches: (d.matches || []).map((m: any) => ({
        message: m.message,
        offset: m.offset,
        length: m.length,
        replacements: m.replacements?.slice(0, 3).map((r: any) => r.value) || [],
        context: m.context?.text || '',
        category: m.rule?.category?.name || 'Grammar',
      })),
    };
  } catch { return null; }
}

function applyFixes(text: string, matches: any[]): string {
  const sorted = [...matches].filter(m => m.replacements?.length > 0).sort((a, b) => b.offset - a.offset);
  let result = text;
  for (const m of sorted) {
    result = result.slice(0, m.offset) + m.replacements[0] + result.slice(m.offset + m.length);
  }
  return result;
}

// Readability score (Flesch-Kincaid approximation)
function readabilityScore(text: string): { score: number; level: string } {
  const words = text.trim().split(/\s+/).length;
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;
  const syllables = text.toLowerCase().replace(/[^a-z]/g, '').replace(/[aeiou]{2,}/g, 'a').match(/[aeiou]/g)?.length || 1;
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const level = clampedScore >= 80 ? 'Very Easy' : clampedScore >= 60 ? 'Standard' : clampedScore >= 40 ? 'Difficult' : 'Very Difficult';
  return { score: clampedScore, level };
}

// AI enhance — tries Groq, then Gemini, then Claude
async function enhanceWriting(text: string, tone: string, keys: Record<string, string>): Promise<{ result: string; provider: string } | null> {
  const tonePrompts: Record<string, string> = {
    formal:     'Make this text more formal and professional. Only return the improved text.',
    casual:     'Make this text more casual and friendly. Only return the improved text.',
    persuasive: 'Make this text more persuasive and compelling. Only return the improved text.',
    concise:    'Make this text more concise — remove fluff. Only return the improved text.',
    hinglish:   'Rewrite this in natural Hinglish (Hindi+English mix). Only return the rewritten text.',
    email:      'Format this as a professional email. Only return the email text.',
    whatsapp:   'Make this sound natural for a WhatsApp message. Short and casual. Only return the text.',
    linkedin:   'Rewrite this for a professional LinkedIn post. Engaging, no fluff. Only return the text.',
    academic:   'Rewrite this in formal academic style. Only return the improved text.',
  };
  const prompt = tonePrompts[tone] || `Improve this text (${tone} style). Only return the improved text.`;

  // Try Groq first (fastest)
  if (keys.groq) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keys.groq}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 800, messages: [
          { role: 'system', content: 'You are a writing assistant. Only return the improved text, nothing else. No explanations.' },
          { role: 'user', content: `${prompt}\n\n${text}` },
        ]}),
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const d = await r.json();
        const result = d.choices?.[0]?.message?.content;
        if (result) return { result, provider: 'Groq' };
      }
    } catch {}
  }

  // Try Gemini (fallback)
  if (keys.gemini) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keys.gemini}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `${prompt}\n\n${text}` }] }], generationConfig: { maxOutputTokens: 800 } }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const d = await r.json();
        const result = d.candidates?.[0]?.content?.parts?.[0]?.text;
        if (result) return { result, provider: 'Gemini' };
      }
    } catch {}
  }

  // Try Claude (last resort)
  if (keys.claude) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': keys.claude, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [
          { role: 'user', content: `${prompt}\n\n${text}` }
        ]}),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const d = await r.json();
        const result = d.content?.[0]?.text;
        if (result) return { result, provider: 'Claude' };
      }
    } catch {}
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { text, lang = 'en-US', tone, mode = 'check' } = await req.json();
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

    const keys = {
      groq:   process.env.GROQ_API_KEY || '',
      gemini: process.env.GEMINI_API_KEY || '',
      claude: process.env.ANTHROPIC_API_KEY || '',
    };

    // Word & char stats
    const wordCount = text.trim().split(/\s+/).length;
    const charCount = text.length;
    const sentenceCount = (text.match(/[.!?]+/g) || []).length || 1;
    const readability = readabilityScore(text);

    // Enhance mode
    if (mode === 'enhance' && tone) {
      const enhanced = await enhanceWriting(text, tone, keys);
      return NextResponse.json({
        original: text, enhanced: enhanced?.result || text, tone,
        provider: enhanced?.provider || 'unavailable',
        stats: { wordCount, charCount, readability },
      });
    }

    // Grammar check
    const result = await languageTool(text, lang);

    if (!result) {
      return NextResponse.json({ matches: [], fixed: text, errorCount: 0, summary: '⚠️ Grammar check temporarily unavailable.', provider: 'unavailable', stats: { wordCount, charCount, readability } });
    }

    const fixed = mode === 'fix' ? applyFixes(text, result.matches) : text;
    const errorCount = result.matches.length;

    const issues = result.matches.slice(0, 10).map((m, i) => ({
      index: i + 1, message: m.message, context: m.context,
      suggestion: m.replacements[0] || '', allSuggestions: m.replacements,
      category: m.category,
    }));

    const summary = errorCount === 0
      ? '✅ Sab sahi hai! Koi grammar error nahi mila.'
      : `⚠️ ${errorCount} issue${errorCount > 1 ? 's' : ''} mila — suggestions neeche hain.`;

    return NextResponse.json({
      original: text, fixed, summary, errorCount, issues,
      provider: 'LanguageTool',
      language: lang,
      stats: { wordCount, charCount, sentenceCount, readability },
    });
  } catch {
    return NextResponse.json({ error: 'Grammar check failed' }, { status: 500 });
  }
}
