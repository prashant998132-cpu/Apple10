'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getDB } from '@/lib/db';

interface Session { id: string; title: string; preview: string; ts: number; count: number; }
interface Props { onSelect: (sessionId: string) => void; currentSession: string; }

function stored(id: string) {
  if (typeof window === 'undefined') return '';
  try { return localStorage.getItem(`session_title_${id}`) || ''; } catch { return ''; }
}

function relTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return 'Abhi';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

function groupSessions(sessions: Session[]) {
  const DAY = 86400000;
  const now = Date.now();
  const groups: [string, Session[]][] = [
    ['Aaj', sessions.filter(s => now - s.ts < DAY)],
    ['Kal', sessions.filter(s => now - s.ts >= DAY && now - s.ts < 2 * DAY)],
    ['Is Hafte', sessions.filter(s => now - s.ts >= 2 * DAY && now - s.ts < 7 * DAY)],
    ['Pehle', sessions.filter(s => now - s.ts >= 7 * DAY)],
  ];
  return groups.filter(([, items]) => items.length > 0);
}

export default function ChatHistorySidebar({ onSelect, currentSession }: Props) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'history' | 'tools'>('history');

  useEffect(() => { setMounted(true); }, []);

  const load = async () => {
    const db = getDB(); if (!db) return;
    const all = await db.messages.toArray();
    const map = new Map<string, Session>();
    for (const m of all) {
      if (!map.has(m.sessionId))
        map.set(m.sessionId, { id: m.sessionId, title: '', preview: '', ts: m.ts, count: 0 });
      const s = map.get(m.sessionId)!;
      s.count++;
      s.ts = Math.max(s.ts, m.ts);
      if (!s.title && m.role === 'user') s.title = stored(m.sessionId) || m.content.slice(0, 45);
      if (!s.preview && m.role === 'user') s.preview = m.content.slice(0, 55);
    }
    setSessions([...map.values()].sort((a, b) => b.ts - a.ts).slice(0, 60));
  };

  useEffect(() => { if (open) load(); }, [open]);

  const del = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const db = getDB(); if (!db) return;
    await db.messages.where('sessionId').equals(id).delete();
    setSessions(s => s.filter(x => x.id !== id));
    if (id === currentSession) onSelect(`session_${Date.now()}`);
  };

  const newChat = () => { onSelect(`session_${Date.now()}`); setOpen(false); };

  const filtered = search
    ? sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.preview.toLowerCase().includes(search.toLowerCase()))
    : sessions;

  const groups = groupSessions(filtered);

  const TOOLS = [
    { icon: '🌤️', label: 'Weather', cmd: 'Aaj ka mausam kaisa hai?' },
    { icon: '📰', label: 'News', cmd: 'Aaj ki top news kya hai?' },
    { icon: '💹', label: 'Crypto', cmd: 'Bitcoin price kitna hai?' },
    { icon: '🖼️', label: 'Image Gen', cmd: 'Ek beautiful India image banao' },
    { icon: '🔢', label: 'Calculator', cmd: 'calculator' },
    { icon: '🎯', label: 'Targets', cmd: 'targets dikhao' },
    { icon: '📋', label: 'Routine', cmd: 'routine dikhao' },
    { icon: '📖', label: 'Wikipedia', cmd: 'kya hai artificial intelligence' },
    { icon: '📍', label: 'Location', cmd: '/location' },
    { icon: '🔋', label: 'Battery', cmd: '/battery' },
    { icon: '📋', label: 'Clipboard', cmd: '/clip' },
    { icon: '⚙️', label: 'Settings', href: '/settings' },
    { icon: '🔐', label: 'Permissions', href: '/permissions' },
    { icon: '📚', label: 'Study', href: '/study' },
    { icon: '🗄️', label: 'Vault', href: '/vault' },
    { icon: '🎯', label: 'Goals', href: '/target' },
  ];

  const drawer = open && mounted ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
      {/* Backdrop */}
      <div onClick={() => setOpen(false)}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />

      {/* Panel */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '285px',
        background: '#0a0c14', borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '12px 0 40px rgba(0,0,0,0.8)',
        animation: 'slideIn 0.2s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{ padding: '14px 12px 10px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#f1f5f9' }}>JARVIS</div>
                <div style={{ fontSize: 9, color: '#374151' }}>₹0 Forever 🔒</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12 }}>✕</button>
          </div>

          {/* New Chat */}
          <button onClick={newChat}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            ✏️ Naya Chat
          </button>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['history', 'tools'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  background: tab === t ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: tab === t ? '#818cf8' : '#374151' }}>
                {t === 'history' ? '💬 History' : '🛠️ Tools'}
              </button>
            ))}
          </div>
        </div>

        {/* Search (history tab only) */}
        {tab === 'history' && (
          <div style={{ padding: '8px 12px 0', flexShrink: 0 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search chats..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 10px', color: '#e2e8f0', fontSize: 11, outline: 'none' }} />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>

          {tab === 'history' ? (
            sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#374151' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                <div style={{ fontSize: 12 }}>Koi history nahi</div>
              </div>
            ) : groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#374151', fontSize: 12 }}>Koi result nahi</div>
            ) : (
              groups.map(([label, items]) => (
                <div key={label}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 6px 3px' }}>
                    {label}
                  </div>
                  {items.map(s => (
                    <div key={s.id}
                      onClick={() => { onSelect(s.id); setOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
                        borderRadius: 9, marginBottom: 1, cursor: 'pointer',
                        background: s.id === currentSession ? 'rgba(99,102,241,0.12)' : 'transparent',
                        border: `1px solid ${s.id === currentSession ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (s.id !== currentSession) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { if (s.id !== currentSession) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {/* Icon */}
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: s.id === currentSession ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                        💬
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: s.id === currentSession ? '#93c5fd' : '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: s.id === currentSession ? 600 : 400 }}>
                          {s.title || 'Naya chat'}
                        </div>
                        <div style={{ fontSize: 9, color: '#374151', marginTop: 1 }}>
                          {s.count} msgs · {relTime(s.ts)}
                        </div>
                      </div>
                      <button onClick={e => del(s.id, e)}
                        style={{ width: 22, height: 22, borderRadius: 5, background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 10, flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )
          ) : (
            /* Tools grid */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '4px 0' }}>
              {TOOLS.map((tool, i) => (
                <button key={i}
                  onClick={() => {
                    setOpen(false);
                    if (tool.href && typeof window !== 'undefined') { window.location.href = tool.href; }
                    else if (tool.cmd) { onSelect(currentSession); setTimeout(() => { const el = document.querySelector('textarea') as HTMLTextAreaElement; if (el) { el.value = tool.cmd; el.dispatchEvent(new Event('input', { bubbles: true })); } }, 200); }
                  }}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{tool.icon}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{tool.label}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, padding: '4px 6px', color: '#4b5563', lineHeight: 1 }}
        title="Chat History">
        🕐
      </button>
      {drawer}
    </>
  );
}
