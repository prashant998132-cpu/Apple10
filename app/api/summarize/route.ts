// ══════════════════════════════════════════════════════════════
// JARVIS URL SUMMARIZER — v29
// Research: Jina Reader (free, r.jina.ai), Mercury Parser,
//           Diffbot free tier, Firecrawl free
//
// Chain: Jina Reader (best, no key) → Firecrawl → Mercury → Basic fetch
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

const FIRECRAWL_KEY  = process.env.FIRECRAWL_API_KEY;  // optional
const DIFFBOT_KEY    = process.env.DIFFBOT_API_KEY;     // optional

// Provider 1: Jina Reader (best, free, no key needed)
async function jinaReader(url: string): Promise<string | null> {
  try {
    const r = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'text',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    // Jina returns markdown text
    const text = await r.text();
    if (text.length < 100) return null;
    return text.slice(0, 8000); // limit
  } catch { return null; }
}

// Provider 2: Firecrawl (free tier available)
async function firecrawl(url: string): Promise<string | null> {
  if (!FIRECRAWL_KEY) return null;
  try {
    const r = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
      },
      body: JSON.stringify({ url, formats: ['markdown'] }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.data?.markdown?.slice(0, 8000) || null;
  } catch { return null; }
}

// Provider 3: Diffbot Article API (free tier)
async function diffbot(url: string): Promise<string | null> {
  if (!DIFFBOT_KEY) return null;
  try {
    const r = await fetch(
      `https://api.diffbot.com/v3/article?url=${encodeURIComponent(url)}&token=${DIFFBOT_KEY}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const article = d.objects?.[0];
    if (!article) return null;
    return `${article.title}\n\n${article.text?.slice(0, 6000) || ''}`;
  } catch { return null; }
}

// Provider 4: Basic fetch + text extract (always works)
async function basicFetch(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JARVIS-AI/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const html = await r.text();
    // Basic HTML stripping
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 5000) || null;
  } catch { return null; }
}

// AI summarization
async function summarize(content: string, url: string, groqKey?: string): Promise<string> {
  const short = content.slice(0, 5000);
  const domain = new URL(url).hostname;

  if (groqKey) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 500,
          messages: [
            {
              role: 'system',
              content: 'Summarize web pages in Hinglish. 3-5 key points. Concise aur clear.',
            },
            {
              role: 'user',
              content: `Website: ${domain}\n\nContent:\n${short}\n\nIs page ka summary do — main points kya hain?`,
            },
          ],
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const d = await r.json();
        return d.choices?.[0]?.message?.content || '';
      }
    } catch {}
  }

  // Basic fallback
  return `📄 **${domain}**\n\n${short.slice(0, 300)}...\n\n_Full summary ke liye AI key set karo_`;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid URL chahiye (http/https)' }, { status: 400 });
    }

    // Try providers
    let content: string | null = null;
    let provider = '';

    const attempts = [
      { name: 'Jina Reader', fn: () => jinaReader(url) },
      { name: 'Firecrawl', fn: () => firecrawl(url) },
      { name: 'Diffbot', fn: () => diffbot(url) },
      { name: 'Basic Fetch', fn: () => basicFetch(url) },
    ];

    for (const a of attempts) {
      content = await a.fn();
      if (content) { provider = a.name; break; }
    }

    if (!content) {
      return NextResponse.json({ error: 'URL content fetch nahi ho paya' }, { status: 500 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const summary = await summarize(content, url, groqKey);

    return NextResponse.json({
      url,
      summary,
      provider,
      contentLength: content.length,
    });
  } catch {
    return NextResponse.json({ error: 'URL summarize failed' }, { status: 500 });
  }
}
