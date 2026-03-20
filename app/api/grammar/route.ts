// ══════════════════════════════════════════════════════════════
// JARVIS GRAMMAR CHECKER — v30
// Research: LanguageTool (best free, no key, 20K chars/req),
//           TextGears (free tier), After the Deadline (open)
//
// Chain: LanguageTool (best) → TextGears → AI grammar fix
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

// Provider 1: LanguageTool (free, no key, best quality)
// Supports 30+ languages including Hindi-English (Hinglish)
async function languageTool(text: string, lang = 'en-US'): Promise<{
  matches: Array<{ message: string; offset: number; length: number; replacements: string[]; context: string }>;
} | null> {
  try {
    const r = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        text: text.slice(0, 20000),
        language: lang,
        enabledOnly: 'false',
      }),
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
      })),
    };
  } catch { return null; }
}

// Provider 2: TextGears (free tier — 100 req/day no key)
async function textGearsCheck(text: string): Promise<any | null> {
  try {
    const r = await fetch(
      `https://api.textgears.com/grammar?text=${encodeURIComponent(text.slice(0, 5000))}&language=en-GB`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// Auto-fix text using LanguageTool results
function applyFixes(text: string, matches: any[]): string {
  // Sort by offset descending so we don't mess up positions
  const sorted = [...matches]
    .filter(m => m.replacements?.length > 0)
    .sort((a, b) => b.offset - a.offset);

  let result = text;
  for (const m of sorted) {
    const before = result.slice(0, m.offset);
    const after = result.slice(m.offset + m.length);
    result = before + m.replacements[0] + after;
  }
  return result;
}

// Writing tone enhancer using AI
async function enhanceWriting(text: string, tone: string, groqKey?: string): Promise<string | null> {
  if (!groqKey) return null;

  const tonePrompts: Record<string, string> = {
    formal: 'Make this text more formal and professional',
    casual: 'Make this text more casual and friendly',
    persuasive: 'Make this text more persuasive and compelling',
    concise: 'Make this text more concise and to the point',
    hinglish: 'Rewrite this in natural Hinglish (Hindi+English mix)',
    email: 'Format this as a professional email',
    whatsapp: 'Make this sound natural for WhatsApp message',
  };

  const prompt = tonePrompts[tone] || `Improve this text (${tone} style)`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 600,
        messages: [
          { role: 'system', content: 'You are a writing assistant. Only return the improved text, nothing else.' },
          { role: 'user', content: `${prompt}:\n\n${text}` },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { text, lang = 'en-US', tone, mode = 'check' } = await req.json();
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

    const groqKey = process.env.GROQ_API_KEY;

    // Mode: 'check' = grammar check, 'fix' = auto-fix, 'enhance' = tone rewrite
    if (mode === 'enhance' && tone) {
      const enhanced = await enhanceWriting(text, tone, groqKey);
      return NextResponse.json({
        original: text,
        enhanced: enhanced || text,
        tone,
        provider: enhanced ? 'Groq AI' : 'fallback',
      });
    }

    // Grammar check
    const result = await languageTool(text, lang);

    if (!result) {
      return NextResponse.json({
        matches: [],
        fixed: text,
        provider: 'unavailable',
        error: 'Grammar check unavailable',
      });
    }

    const fixed = mode === 'fix' ? applyFixes(text, result.matches) : text;
    const errorCount = result.matches.length;

    // Format results
    const issues = result.matches.slice(0, 8).map((m, i) => ({
      index: i + 1,
      message: m.message,
      context: m.context,
      suggestion: m.replacements[0] || '',
      allSuggestions: m.replacements,
    }));

    let summary = '';
    if (errorCount === 0) {
      summary = '✅ Koi grammar error nahi mila! Sab sahi hai.';
    } else {
      summary = `⚠️ ${errorCount} issue${errorCount > 1 ? 's' : ''} mila${errorCount > 1 ? 'e' : ''} — suggestions neeche hain.`;
    }

    return NextResponse.json({
      original: text,
      fixed,
      summary,
      errorCount,
      issues,
      provider: 'LanguageTool',
      language: lang,
    });
  } catch {
    return NextResponse.json({ error: 'Grammar check failed' }, { status: 500 });
  }
}
