import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || 'nature india';
  const type = searchParams.get('type') || 'photos';
  const key = process.env.PEXELS_API_KEY || '';

  if (!key) {
    return NextResponse.json({
      error: 'PEXELS_API_KEY not set',
      tip: 'pexels.com/api pe free key lo',
      fallback: `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}`,
    });
  }

  const base = 'https://api.pexels.com';
  const endpoint = type === 'videos'
    ? `${base}/videos/search?query=${encodeURIComponent(q)}&per_page=6`
    : `${base}/v1/search?query=${encodeURIComponent(q)}&per_page=6&orientation=landscape`;

  try {
    const r = await fetch(endpoint, {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(7000),
    });
    if (r.ok) {
      const d = await r.json();
      if (type === 'videos') {
        return NextResponse.json({
          type: 'videos',
          items: (d.videos || []).map((v: any) => ({
            id: v.id,
            url: v.video_files?.[0]?.link,
            thumb: v.image,
            duration: v.duration,
            width: v.width,
            height: v.height,
            photographer: v.user?.name,
          })),
        });
      }
      return NextResponse.json({
        type: 'photos',
        items: (d.photos || []).map((p: any) => ({
          id: p.id,
          url: p.src?.large || p.src?.original,
          thumb: p.src?.medium,
          alt: p.alt,
          photographer: p.photographer,
          photographer_url: p.photographer_url,
        })),
      });
    }
  } catch {}
  return NextResponse.json({ error: 'Pexels unavailable' }, { status: 503 });
}
