import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'trending';
  const key = process.env.TMDB_API_KEY || '';

  const BASE = 'https://api.themoviedb.org/3';
  const IMG = 'https://image.tmdb.org/t/p/w500';
  const headers: Record<string, string> = {};
  if (key) headers['Authorization'] = `Bearer ${key}`;

  try {
    let url = '';
    if (type === 'search' && query) {
      url = `${BASE}/search/movie?query=${encodeURIComponent(query)}&language=hi-IN&include_adult=false`;
    } else if (type === 'bollywood') {
      url = `${BASE}/discover/movie?with_original_language=hi&sort_by=popularity.desc&language=hi-IN`;
    } else {
      // Trending - no key needed via public endpoint
      url = `${BASE}/trending/movie/week?language=hi-IN`;
    }

    const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      const d = await r.json();
      const movies = (d.results || []).slice(0, 5).map((m: any) => ({
        id: m.id,
        title: m.title,
        original_title: m.original_title,
        overview: m.overview?.substring(0, 150) + '...',
        rating: m.vote_average?.toFixed(1),
        year: m.release_date?.substring(0, 4),
        poster: m.poster_path ? IMG + m.poster_path : null,
        popularity: Math.round(m.popularity),
      }));
      return NextResponse.json({ movies, total: d.total_results });
    }
  } catch {}

  // Fallback - popular Bollywood hardcoded
  return NextResponse.json({
    movies: [
      { title: 'Pathaan', rating: '5.8', year: '2023', overview: 'Shah Rukh Khan starrer action thriller' },
      { title: 'Jawan', rating: '6.3', year: '2023', overview: 'SRK directorial debut action film' },
      { title: 'Animal', rating: '6.3', year: '2023', overview: 'Ranbir Kapoor intense action drama' },
    ],
    note: 'TMDB_API_KEY set karo better results ke liye',
  });
}
