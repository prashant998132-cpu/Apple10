import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
export const revalidate = 900; // 15 min cache

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || 'india';

  // Source 1: GNews free tier
  const GNEWS = process.env.GNEWS_API_KEY;
  if (GNEWS) {
    try {
      const r = await fetch(
        `https://gnews.io/api/v4/top-headlines?country=in&category=${category}&max=6&apikey=${GNEWS}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const d = await r.json();
        return NextResponse.json({
          articles: d.articles?.map((a: any) => ({
            title: a.title, source: a.source?.name || 'News', url: a.url,
            publishedAt: a.publishedAt, description: a.description,
          })) || [],
          source: 'gnews',
        });
      }
    } catch {}
  }

  // Source 2: RSS via public proxy
  try {
    const feeds: Record<string, string> = {
      india: 'https://feeds.feedburner.com/ndtvnews-india-news',
      tech:  'https://feeds.feedburner.com/ndtvnews-tech',
      sports: 'https://sports.ndtv.com/rss/all',
    };
    const feedUrl = feeds[category] || feeds.india;
    const r = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=6`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (r.ok) {
      const d = await r.json();
      return NextResponse.json({
        articles: (d.items || []).map((a: any) => ({
          title: a.title, source: d.feed?.title || 'NDTV',
          url: a.link, publishedAt: a.pubDate, description: a.description,
        })),
        source: 'rss',
      });
    }
  } catch {}

  return NextResponse.json({ articles: [], error: 'News unavailable' }, { status: 500 });
}
