import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || 'classic movie';
  const mediatype = searchParams.get('type') || 'movies';

  try {
    const r = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}+AND+mediatype:${mediatype}&fl[]=identifier,title,description,year,subject,downloads&sort[]=downloads+desc&rows=6&output=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (r.ok) {
      const d = await r.json();
      const items = (d.response?.docs || []).map((item: any) => ({
        id: item.identifier,
        title: item.title,
        description: item.description?.substring?.(0, 150) || '',
        year: item.year,
        downloads: item.downloads,
        embed: `https://archive.org/embed/${item.identifier}`,
        page: `https://archive.org/details/${item.identifier}`,
        thumb: `https://archive.org/services/img/${item.identifier}`,
      }));
      return NextResponse.json({ items, total: d.response?.numFound });
    }
  } catch {}
  return NextResponse.json({ error: 'Archive.org unavailable' }, { status: 503 });
}
