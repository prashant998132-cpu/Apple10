'use client';
import { useState, useEffect, useRef } from 'react';

const STYLES = [
  { id: 'flux',          label: '✨ Best',     desc: 'High quality' },
  { id: 'flux-realism',  label: '📷 Photo',    desc: 'Photorealistic' },
  { id: 'flux-anime',    label: '🎌 Anime',    desc: 'Manga style' },
  { id: 'flux-3d',       label: '🎮 3D',       desc: 'CGI render' },
  { id: 'turbo',         label: '⚡ Fast',     desc: 'Quick gen' },
];

const SIZES = [
  { id: '512x512',   label: '1:1', icon: '⬛' },
  { id: '768x512',   label: '3:2', icon: '▬' },
  { id: '512x768',   label: '2:3', icon: '▮' },
  { id: '1024x576',  label: '16:9', icon: '🖥️' },
];

const IDEAS = [
  'A futuristic city at night, neon lights, cyberpunk',
  'A majestic tiger in a jungle waterfall, ultra realistic',
  'Iron Man suit flying over Mumbai skyline',
  'A cute robot cooking Indian food in a kitchen',
  'Mount Kailash surrounded by clouds, golden hour',
  'Abstract art with vibrant colors and geometric shapes',
  'A dragon flying over Himalayan mountains',
  'Underwater world with glowing fish, deep ocean',
];

interface HistoryItem { url: string; prompt: string; style: string; size: string; ts: number; }

function loadHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem('jarvis_image_history') || '[]'); }
  catch { return []; }
}
function saveHistory(h: HistoryItem[]) {
  try { localStorage.setItem('jarvis_image_history', JSON.stringify(h.slice(0, 24))); } catch {}
}

export default function ImagePage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('flux');
  const [size, setSize] = useState('512x512');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const [tab, setTab] = useState<'create'|'gallery'>('create');
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<any>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setProgress(0);

    // Fake progress
    progressRef.current = setInterval(() => {
      setProgress(p => p < 85 ? p + Math.random() * 8 : p);
    }, 400);

    const selectedStyle = STYLES.find(s => s.id === style);
    const [w, h] = size.split('x').map(Number);
    const fullPrompt = prompt.trim() + ', ' + (selectedStyle?.desc || '');

    try {
      const r = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, width: w, height: h, model: style }),
      });
      const d = await r.json();
      clearInterval(progressRef.current);
      setProgress(100);
      if (d.url) {
        const item: HistoryItem = { url: d.url, prompt: prompt.trim(), style, size, ts: Date.now() };
        const newH = [item, ...history.slice(0, 23)];
        setHistory(newH);
        saveHistory(newH);
        setTab('gallery');
        setTimeout(() => setProgress(0), 500);
      }
    } catch {
      clearInterval(progressRef.current);
      setProgress(0);
    }
    setLoading(false);
  };

  const deleteItem = (ts: number) => {
    const newH = history.filter(h => h.ts !== ts);
    setHistory(newH);
    saveHistory(newH);
  };

  const share = async (url: string, p: string) => {
    if (navigator.share) {
      try { await navigator.share({ title: 'JARVIS AI Image', text: p, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#070810', color: '#e2e8f0', fontFamily: 'sans-serif', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#0a0c14', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎨 AI Image Studio
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['create','gallery'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: tab === t ? 'rgba(167,139,250,0.2)' : 'transparent', color: tab === t ? '#a78bfa' : '#475569' }}>
              {t === 'create' ? '✏️ Create' : `🖼️ Gallery (${history.length})`}
            </button>
          ))}
        </div>
      </div>

      {tab === 'create' ? (
        <div style={{ padding: 14 }}>
          {/* Prompt input */}
          <div style={{ background: '#0d1117', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); }}}
              placeholder="Kya banana hai? English mein likho for best results..."
              rows={3}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 14, resize: 'none', lineHeight: 1.6 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, gap: 6 }}>
              <button onClick={() => setPrompt('')}
                style={{ fontSize: 10, color: '#374151', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
              <span style={{ fontSize: 10, color: '#374151' }}>{prompt.length}/300</span>
            </div>
          </div>

          {/* Prompt ideas */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>💡 Prompt Ideas</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {IDEAS.map((idea, i) => (
                <button key={i} onClick={() => setPrompt(idea)}
                  style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#6b7280', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {idea.substring(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>🎭 Style</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  style={{ padding: '8px 4px', borderRadius: 10, border: '1px solid', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: style === s.id ? '#a78bfa' : 'rgba(255,255,255,0.07)',
                    background: style === s.id ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: style === s.id ? '#a78bfa' : '#6b7280' }}>{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>📐 Size / Ratio</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {SIZES.map(s => (
                <button key={s.id} onClick={() => setSize(s.id)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: '1px solid', textAlign: 'center', cursor: 'pointer',
                    borderColor: size === s.id ? '#22d3ee' : 'rgba(255,255,255,0.07)',
                    background: size === s.id ? 'rgba(34,211,238,0.1)' : 'transparent' }}>
                  <div style={{ fontSize: 14 }}>{s.icon}</div>
                  <div style={{ fontSize: 9, color: size === s.id ? '#22d3ee' : '#374151', marginTop: 2, fontWeight: 700 }}>{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          {loading && (
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: progress + '%', background: 'linear-gradient(90deg,#a78bfa,#22d3ee)', borderRadius: 99, transition: 'width 0.4s' }} />
            </div>
          )}

          {/* Generate button */}
          <button onClick={generate} disabled={loading || !prompt.trim()}
            style={{ width: '100%', padding: 15, borderRadius: 14, border: 'none', cursor: loading || !prompt.trim() ? 'default' : 'pointer',
              background: loading ? 'rgba(167,139,250,0.2)' : prompt.trim() ? 'linear-gradient(135deg,#a78bfa,#22d3ee)' : 'rgba(255,255,255,0.04)',
              color: prompt.trim() ? '#fff' : '#374151', fontSize: 15, fontWeight: 900, letterSpacing: '-0.3px', transition: 'all 0.2s' }}>
            {loading ? '⏳ Generating...' : '✨ Generate Image — Free!'}
          </button>
        </div>
      ) : (
        /* Gallery tab */
        <div style={{ padding: 14 }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#374151' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
              <div style={{ fontSize: 14 }}>Koi image nahi abhi</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Create tab mein banao!</div>
            </div>
          ) : (
            <div style={{ columns: 2, gap: 10 }}>
              {history.map((item) => (
                <div key={item.ts} style={{ breakInside: 'avoid', marginBottom: 10, position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: '#0d1117' }}>
                  <img src={item.url} alt={item.prompt} loading="lazy"
                    style={{ width: '100%', display: 'block', cursor: 'pointer' }}
                    onClick={() => setFullscreen(item.url)} />
                  <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.4, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.prompt}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <a href={item.url} download={`jarvis-${item.ts}.jpg`}
                        style={{ flex: 1, textAlign: 'center', padding: '4px', borderRadius: 6, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', textDecoration: 'none', fontSize: 10, fontWeight: 700 }}>
                        ⬇️ Save
                      </a>
                      <button onClick={() => share(item.url, item.prompt)}
                        style={{ flex: 1, padding: '4px', borderRadius: 6, background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                        📤 Share
                      </button>
                      <button onClick={() => deleteItem(item.ts)}
                        style={{ padding: '4px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', fontSize: 10, cursor: 'pointer' }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen viewer */}
      {fullscreen && (
        <div onClick={() => setFullscreen(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={fullscreen} alt="fullscreen" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 14, objectFit: 'contain' }} />
          <button onClick={() => setFullscreen(null)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
          <a href={fullscreen} download="jarvis-image.jpg"
            style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: 'rgba(167,139,250,0.9)', color: '#fff', padding: '10px 24px', borderRadius: 99, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            ⬇️ Download
          </a>
        </div>
      )}
    </div>
  );
}
