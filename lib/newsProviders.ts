// ══════════════════════════════════════════════════════════════
// JARVIS NEWS PROVIDERS — Multi-Source Smart Router
// Research: GNews, NewsData, RSS feeds, DuckDuckGo
// All free options, fallback chain
// ══════════════════════════════════════════════════════════════

const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY;
const GNEWS_KEY    = process.env.GNEWS_API_KEY;

// Provider 1: NewsData.io (200 requests/day free)
async function newsDataIO(query = 'india', lang = 'hi,en'): Promise<string | null> {
  if (!NEWSDATA_KEY) return null;
  try {
    const r = await fetch(
      `https://newsdata.io/api/1/news?apikey=${NEWSDATA_KEY}&q=${encodeURIComponent(query)}&language=${lang}&size=5`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.results?.length) return null;
    const headlines = d.results.slice(0, 5).map((a: any, i: number) =>
      `${i + 1}. **${a.title}**\n   📍 ${a.source_name} · ${new Date(a.pubDate).toLocaleDateString('hi-IN')}`
    ).join('\n\n');
    return `📰 **Aaj ki khabar:**\n\n${headlines}`;
  } catch { return null; }
}

// Provider 2: GNews (100/day free)
async function gNews(query = 'india', lang = 'hi'): Promise<string | null> {
  if (!GNEWS_KEY) return null;
  try {
    const r = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${lang}&max=5&token=${GNEWS_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.articles?.length) return null;
    const headlines = d.articles.slice(0, 5).map((a: any, i: number) =>
      `${i + 1}. **${a.title}**\n   📍 ${a.source.name}`
    ).join('\n\n');
    return `📰 **Latest News:**\n\n${headlines}`;
  } catch { return null; }
}

// Provider 3: Google News RSS (no key, always works)
async function googleNewsRSS(topic = 'India'): Promise<string | null> {
  try {
    const r = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=hi&gl=IN&ceid=IN:hi`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return null;
    const xml = await r.text();
    const items = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)].slice(1, 6);
    const sources = [...xml.matchAll(/<source[^>]*>([^<]+)<\/source>/g)].slice(0, 5);
    if (!items.length) return null;
    const headlines = items.map((m, i) =>
      `${i + 1}. ${m[1]}${sources[i] ? `\n   📍 ${sources[i][1]}` : ''}`
    ).join('\n\n');
    return `📰 **Google News — ${topic}:**\n\n${headlines}`;
  } catch { return null; }
}

// Provider 4: BBC Hindi RSS (no key)
async function bbcHindiRSS(): Promise<string | null> {
  try {
    const r = await fetch('https://feeds.bbci.co.uk/hindi/rss.xml', { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const xml = await r.text();
    const titles = [...xml.matchAll(/<title>(.*?)<\/title>/g)].slice(1, 6);
    if (!titles.length) return null;
    const headlines = titles.map((m, i) =>
      `${i + 1}. ${m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim()}`
    ).join('\n\n');
    return `📰 **BBC Hindi:**\n\n${headlines}`;
  } catch { return null; }
}

// Provider 5: Inshorts API (Indian news, no key)
async function inshortsNews(category = 'top'): Promise<string | null> {
  try {
    const r = await fetch(
      `https://inshortsapi.vercel.app/news?category=${category}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const articles = d.data?.slice(0, 5);
    if (!articles?.length) return null;
    const headlines = articles.map((a: any, i: number) =>
      `${i + 1}. **${a.title}**\n   ${a.content?.slice(0, 100)}...`
    ).join('\n\n');
    return `📰 **Inshorts — Top News:**\n\n${headlines}`;
  } catch { return null; }
}

// ── Smart news fetcher ───────────────────────────────────────
export async function getNews(query = 'India today', category = 'top'): Promise<string> {
  // Try providers in order
  const providers = [
    () => newsDataIO(query),
    () => gNews(query),
    () => googleNewsRSS(query),
    () => bbcHindiRSS(),
    () => inshortsNews(category),
  ];

  for (const fn of providers) {
    try {
      const result = await fn();
      if (result) return result;
    } catch {}
  }

  return '📰 Abhi news fetch nahi ho pa rahi. Thodi der mein try karo.';
}
