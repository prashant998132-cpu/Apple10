'use client';
import { useState } from 'react';

const GENRES = ['Action', 'Comedy', 'Drama', 'Thriller', 'Horror', 'Romance', 'Sci-Fi', 'Animation'];

const FREE_MOVIES = [
  { title: 'Sholay', year: '1975', url: 'https://archive.org/details/sholay-1975', thumb: '🎬', desc: 'Classic Bollywood action drama', genre: 'Action' },
  { title: 'Mother India', year: '1957', url: 'https://archive.org/details/mother-india-1957', thumb: '🎭', desc: 'Classic Indian drama', genre: 'Drama' },
  { title: 'Sahib Bibi Aur Ghulam', year: '1962', url: 'https://archive.org/details/sahib-bibi-aur-ghulam', thumb: '🎞️', desc: 'Classic Bollywood', genre: 'Drama' },
];

interface MovieResult { title: string; year: string; url: string; embed?: string; desc: string; downloads?: number; }

export default function EntertainmentPage() {
  const [tab, setTab] = useState<'movies'|'music'|'youtube'>('movies');
  const [movieSearch, setMovieSearch] = useState('');
  const [movies, setMovies] = useState<MovieResult[]>([]);
  const [ytSearch, setYtSearch] = useState('');
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [playUrl, setPlayUrl] = useState('');

  const searchMovies = async () => {
    if (!movieSearch.trim()) return;
    setLoading(true);
    try {
      const r = await fetch('/api/archive?q=' + encodeURIComponent(movieSearch) + '&type=movies');
      const d = await r.json();
      if (d.items?.length > 0) {
        setMovies(d.items.map((item: any) => ({
          title: item.title,
          year: item.year || '?',
          url: item.page,
          embed: item.embed,
          desc: item.description || '',
          downloads: item.downloads,
        })));
      } else {
        setMovies([]);
      }
    } catch { setMovies([]); }
    setLoading(false);
  };

  const searchYoutube = async () => {
    if (!ytSearch.trim()) return;
    setLoading(true);
    try {
      const query = encodeURIComponent(ytSearch);
      // Use YouTube oEmbed to get video info
      const r = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Find YouTube video IDs for: "${ytSearch}". Give 5 results as JSON array: [{"title": "...", "id": "VIDEO_ID", "channel": "..."}]. Only respond with JSON, no explanation.` }],
          system: 'You are a helpful assistant. Respond only with valid JSON array.',
          mode: 'flash',
        }),
      });
      if (r.body) {
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let text = '';
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value);
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try { const p = JSON.parse(data); const chunk = p?.choices?.[0]?.delta?.content || ''; if (chunk) text += chunk; } catch {}
          }
        }
        try {
          const clean = text.replace(/```json|```/g, '').trim();
          const results = JSON.parse(clean);
          setYtResults(Array.isArray(results) ? results : []);
        } catch { setYtResults([]); }
      }
    } catch { setYtResults([]); }
    setLoading(false);
  };

  const MUSIC_CATEGORIES = [
    { label: '🎵 Bollywood Hits', query: 'bollywood songs 2024 playlist', icon: '🎬' },
    { label: '🎸 Punjabi', query: 'punjabi songs 2024 playlist', icon: '🎸' },
    { label: '😌 Chill Lofi', query: 'lofi hip hop study beats playlist', icon: '☕' },
    { label: '🙏 Bhajans', query: 'bhajan songs hindi playlist', icon: '🕉️' },
    { label: '💪 Workout', query: 'gym workout motivation music playlist', icon: '🏋️' },
    { label: '🌙 Night Vibes', query: 'midnight vibes songs playlist', icon: '🌙' },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: '#070810', color: '#e2e8f0', fontFamily: 'sans-serif', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#0a0c14', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 900, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎬 Entertainment Hub
        </div>
        <div style={{ fontSize: 10, color: '#374151' }}>100% Free</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0a0c14' }}>
        {([['movies','🎬 Movies'],['music','🎵 Music'],['youtube','▶️ YouTube']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, padding: '10px 4px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              color: tab === id ? '#f59e0b' : '#475569',
              borderBottom: tab === id ? '2px solid #f59e0b' : '2px solid transparent' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: 14 }}>
        {/* MOVIES */}
        {tab === 'movies' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input value={movieSearch} onChange={e => setMovieSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchMovies()}
                placeholder="Movie search karo..."
                style={{ flex: 1, background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none' }} />
              <button onClick={searchMovies} disabled={loading}
                style={{ padding: '10px 16px', background: loading ? 'rgba(245,158,11,0.2)' : '#f59e0b', border: 'none', borderRadius: 10, color: loading ? '#6b7280' : '#000', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>
                {loading ? '⏳' : '🔍'}
              </button>
            </div>

            {movies.length === 0 && !loading && (
              <>
                <div style={{ fontSize: 11, color: '#374151', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Classic Films — Free on Internet Archive</div>
                {FREE_MOVIES.map((m, i) => (
                  <a key={i} href={m.url} target="_blank" rel="noreferrer"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, marginBottom: 8, cursor: 'pointer' }}>
                    <div style={{ fontSize: 36, width: 48, textAlign: 'center' }}>{m.thumb}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{m.title} ({m.year})</div>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{m.desc}</div>
                      <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4, fontWeight: 700 }}>▶ Free Watch</div>
                    </div>
                  </a>
                ))}
              </>
            )}

            {movies.map((m, i) => (
              <div key={i} style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
                {playUrl === m.embed && m.embed ? (
                  <iframe src={m.embed} style={{ width: '100%', height: 200, border: 'none' }} allowFullScreen />
                ) : (
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{m.title} {m.year !== '?' ? `(${m.year})` : ''}</div>
                    {m.desc && <div style={{ fontSize: 11, color: '#475569', marginBottom: 8, lineHeight: 1.5 }}>{m.desc.substring(0, 100)}{m.desc.length > 100 ? '...' : ''}</div>}
                    {m.downloads && <div style={{ fontSize: 10, color: '#374151', marginBottom: 8 }}>📥 {m.downloads.toLocaleString('en-IN')} downloads</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {m.embed && (
                        <button onClick={() => setPlayUrl(m.embed || '')}
                          style={{ flex: 1, padding: '8px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, color: '#f59e0b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          ▶ Play Here
                        </button>
                      )}
                      <a href={m.url} target="_blank" rel="noreferrer"
                        style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#94a3b8', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
                        🔗 Open Page
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MUSIC */}
        {tab === 'music' && (
          <div>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 14, lineHeight: 1.6 }}>
              YouTube pe music sunne ke liye category choose karo 👇
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MUSIC_CATEGORIES.map((cat, i) => (
                <a key={i}
                  href={'https://www.youtube.com/results?search_query=' + encodeURIComponent(cat.query)}
                  target="_blank" rel="noreferrer"
                  style={{ textDecoration: 'none', background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 28 }}>{cat.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{cat.label}</span>
                  <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>▶ YouTube pe kholo</span>
                </a>
              ))}
            </div>

            <div style={{ marginTop: 16, background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', marginBottom: 10 }}>🎵 Spotify mein sunna hai?</div>
              <a href="https://open.spotify.com" target="_blank" rel="noreferrer"
                style={{ display: 'block', width: '100%', textAlign: 'center', padding: '12px', background: 'rgba(30,215,96,0.1)', border: '1px solid rgba(30,215,96,0.3)', borderRadius: 10, color: '#1ed760', fontWeight: 800, fontSize: 13, textDecoration: 'none', marginBottom: 8 }}>
                🎵 Spotify Open karo
              </a>
              <a href="https://gaana.com" target="_blank" rel="noreferrer"
                style={{ display: 'block', width: '100%', textAlign: 'center', padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
                🎶 Gaana.com (Hindi free)
              </a>
            </div>
          </div>
        )}

        {/* YOUTUBE */}
        {tab === 'youtube' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input value={ytSearch} onChange={e => setYtSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchYoutube()}
                placeholder="YouTube search karo..."
                style={{ flex: 1, background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none' }} />
              <button onClick={searchYoutube} disabled={loading}
                style={{ padding: '10px 16px', background: loading ? 'rgba(239,68,68,0.2)' : '#ef4444', border: 'none', borderRadius: 10, color: loading ? '#6b7280' : '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>
                {loading ? '⏳' : '▶'}
              </button>
            </div>

            {ytResults.length > 0 && (
              <div>
                {ytResults.map((v, i) => (
                  <a key={i} href={'https://youtube.com/watch?v=' + v.id} target="_blank" rel="noreferrer"
                    style={{ textDecoration: 'none', display: 'flex', gap: 12, padding: '10px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ width: 80, height: 45, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#070810' }}>
                      <img src={'https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg'} alt={v.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.4 }}>{v.title}</div>
                      {v.channel && <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{v.channel}</div>}
                      <div style={{ fontSize: 10, color: '#ef4444', marginTop: 3, fontWeight: 700 }}>▶ Watch on YouTube</div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {ytResults.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#374151' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>▶️</div>
                <div style={{ fontSize: 13 }}>Kuch bhi search karo</div>
              </div>
            )}

            <div style={{ marginTop: 14, padding: 14, background: '#0d1117', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14 }}>
              <a href="https://youtube.com" target="_blank" rel="noreferrer"
                style={{ display: 'block', width: '100%', textAlign: 'center', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, color: '#ef4444', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
                ▶️ YouTube App Kholo
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
