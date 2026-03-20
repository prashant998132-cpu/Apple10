// ══════════════════════════════════════════════════════════════
// JARVIS SEARCH PROVIDERS — Multi-Source
// Research: Brave Search best free (2000/month), 
//           DuckDuckGo instant answers (no key),
//           Wikipedia REST API (no key)
// ══════════════════════════════════════════════════════════════

const BRAVE_KEY  = process.env.BRAVE_API_KEY;
const SERPER_KEY = process.env.SERPER_API_KEY;

// Provider 1: Brave Search (best quality, 2000 req/month free)
async function braveSearch(query: string): Promise<string | null> {
  if (!BRAVE_KEY) return null;
  try {
    const r = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': BRAVE_KEY },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const results = d.web?.results?.slice(0, 4);
    if (!results?.length) return null;
    const formatted = results.map((r: any, i: number) =>
      `**${i + 1}. ${r.title}**\n${r.description?.slice(0, 150)}...\n🔗 ${r.url}`
    ).join('\n\n');
    return `🔍 **Search: "${query}"**\n\n${formatted}`;
  } catch { return null; }
}

// Provider 2: Serper (Google results, 2500 free credits)
async function serperSearch(query: string): Promise<string | null> {
  if (!SERPER_KEY) return null;
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 5, gl: 'in', hl: 'hi' }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const d = await r.json();

    // Answer box (instant answer)
    if (d.answerBox?.answer) return `💡 **${query}**\n\n${d.answerBox.answer}`;
    if (d.answerBox?.snippet) return `💡 **${query}**\n\n${d.answerBox.snippet}`;

    // Knowledge graph
    if (d.knowledgeGraph?.description) {
      return `📚 **${d.knowledgeGraph.title}**\n\n${d.knowledgeGraph.description}`;
    }

    // Organic results
    const results = d.organic?.slice(0, 4);
    if (!results?.length) return null;
    const formatted = results.map((r: any, i: number) =>
      `**${i + 1}. ${r.title}**\n${r.snippet?.slice(0, 150)}`
    ).join('\n\n');
    return `🔍 **"${query}":**\n\n${formatted}`;
  } catch { return null; }
}

// Provider 3: DuckDuckGo Instant Answers (no key)
async function duckDuckGoSearch(query: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return null;
    const d = await r.json();

    if (d.AbstractText) {
      return `📖 **${d.Heading || query}**\n\n${d.AbstractText}\n\n*Source: ${d.AbstractSource || 'DuckDuckGo'}*`;
    }
    if (d.Answer) return `💡 **${query}**\n\n${d.Answer}`;
    if (d.Definition) return `📖 **Definition:**\n\n${d.Definition}`;

    // Related topics
    const topics = d.RelatedTopics?.slice(0, 4).filter((t: any) => t.Text);
    if (topics?.length) {
      return `🔍 **${query}:**\n\n${topics.map((t: any) => `• ${t.Text?.slice(0, 120)}`).join('\n')}`;
    }
    return null;
  } catch { return null; }
}

// Provider 4: Wikipedia (no key, deep info)
async function wikipediaSearch(query: string): Promise<string | null> {
  try {
    // First search for page
    const searchR = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!searchR.ok) return null;
    const [, titles] = await searchR.json();
    if (!titles?.length) return null;

    // Get summary
    const summaryR = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titles[0])}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!summaryR.ok) return null;
    const d = await summaryR.json();
    if (!d.extract) return null;

    return `📚 **${d.title}**\n\n${d.extract.slice(0, 400)}${d.extract.length > 400 ? '...' : ''}\n\n🔗 ${d.content_urls?.desktop?.page || ''}`;
  } catch { return null; }
}

// Provider 5: Hindi Wikipedia
async function hindiWikipedia(query: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://hi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.extract) return null;
    return `📚 **${d.title}** (Hindi Wikipedia)\n\n${d.extract.slice(0, 400)}`;
  } catch { return null; }
}

// ── Smart search ─────────────────────────────────────────────
export async function smartSearch(query: string): Promise<string> {
  const providers = [
    () => serperSearch(query),    // Google results
    () => braveSearch(query),     // Brave
    () => duckDuckGoSearch(query), // DDG instant
    () => wikipediaSearch(query), // Wikipedia
    () => hindiWikipedia(query),  // Hindi wiki
  ];

  for (const fn of providers) {
    try {
      const r = await fn();
      if (r) return r;
    } catch {}
  }

  return `🔍 "${query}" ke liye search result nahi mila. Kuch aur try karo.`;
}
