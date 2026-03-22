import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'web';
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });

  // ── 1. Tavily AI Search (best, AI-optimized, 1000/month free) ──
  const tavilyKey = process.env.TAVILY_API_KEY || '';
  if (tavilyKey) {
    try {
      const r = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: q,
          search_depth: 'basic',
          max_results: 5,
          include_answer: true,
          include_raw_content: false,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const d = await r.json();
        return NextResponse.json({
          source: 'tavily',
          answer: d.answer,
          results: (d.results || []).map((r: any) => ({
            title: r.title, url: r.url, snippet: r.content?.substring(0, 200),
          })),
        });
      }
    } catch {}
  }

  // ── 2. Exa Semantic Search (1000/month free) ──
  const exaKey = process.env.EXA_API_KEY || '';
  if (exaKey) {
    try {
      const r = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': exaKey },
        body: JSON.stringify({ query: q, numResults: 5, useAutoprompt: true }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const d = await r.json();
        return NextResponse.json({
          source: 'exa',
          results: (d.results || []).map((r: any) => ({
            title: r.title, url: r.url, snippet: r.text?.substring(0, 200),
          })),
        });
      }
    } catch {}
  }

  // ── 3. Brave Search (2000/month free) ──
  const braveKey = process.env.BRAVE_API_KEY || '';
  if (braveKey) {
    try {
      const r = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=5`,
        { headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey }, signal: AbortSignal.timeout(6000) }
      );
      if (r.ok) {
        const d = await r.json();
        return NextResponse.json({
          source: 'brave',
          results: (d.web?.results || []).map((r: any) => ({
            title: r.title, url: r.url, snippet: r.description,
          })),
        });
      }
    } catch {}
  }

  // ── 4. Serper (2500/month free) ──
  const serperKey = process.env.SERPER_API_KEY || '';
  if (serperKey) {
    try {
      const r = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, num: 5 }),
        signal: AbortSignal.timeout(6000),
      });
      if (r.ok) {
        const d = await r.json();
        return NextResponse.json({
          source: 'serper',
          results: (d.organic || []).map((r: any) => ({
            title: r.title, url: r.link, snippet: r.snippet,
          })),
        });
      }
    } catch {}
  }

  // ── 5. DuckDuckGo (no key, always works) ──
  try {
    const r = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (r.ok) {
      const d = await r.json();
      const results = [
        ...(d.RelatedTopics || []).slice(0, 4).map((t: any) => ({
          title: t.Text?.split(' - ')[0] || q,
          url: t.FirstURL || '',
          snippet: t.Text || '',
        })),
      ];
      if (d.AbstractText) {
        return NextResponse.json({ source: 'duckduckgo', answer: d.AbstractText, results });
      }
      if (results.length > 0) return NextResponse.json({ source: 'duckduckgo', results });
    }
  } catch {}

  // ── 6. Wikipedia (always free) ──
  try {
    const r = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.split(' ')[0])}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (r.ok) {
      const d = await r.json();
      return NextResponse.json({
        source: 'wikipedia',
        answer: d.extract?.substring(0, 400),
        results: [{ title: d.title, url: d.content_urls?.desktop?.page, snippet: d.description }],
      });
    }
  } catch {}

  // ── 7. GDELT News (unlimited free) ──
  try {
    const r = await fetch(
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&maxrecords=5&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (r.ok) {
      const d = await r.json();
      return NextResponse.json({
        source: 'gdelt',
        results: (d.articles || []).map((a: any) => ({
          title: a.title, url: a.url, snippet: a.seendate,
        })),
      });
    }
  } catch {}

  return NextResponse.json({ error: 'All search providers failed' }, { status: 503 });
}
