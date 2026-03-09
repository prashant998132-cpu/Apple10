'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getDB } from '@/lib/db';

interface Session { id: string; preview: string; ts: number; count: number; }
interface Props { onSelect: (sessionId: string) => void; currentSession: string; }

export default function ChatHistorySidebar({ onSelect, currentSession }: Props) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const load = async () => {
    const db = getDB(); if (!db) return;
    const all = await db.messages.toArray();
    const map = new Map<string, Session>();
    for (const m of all) {
      if (!map.has(m.sessionId)) map.set(m.sessionId, { id: m.sessionId, preview: '', ts: m.ts, count: 0 });
      const s = map.get(m.sessionId)!;
      s.count++;
      s.ts = Math.max(s.ts, m.ts);
      if (m.role === 'user' && !s.preview) s.preview = m.content.slice(0, 55);
    }
    setSessions([...map.values()].sort((a, b) => b.ts - a.ts).slice(0, 30));
  };

  useEffect(() => { if (open) load(); }, [open]);

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const db = getDB(); if (!db) return;
    await db.messages.where('sessionId').equals(id).delete();
    setSessions(s => s.filter(x => x.id !== id));
  };

  const drawer = open && mounted ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      />
      {/* Drawer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '280px',
        background: '#111318', borderRight: '1px solid #1e2433',
        display: 'flex', flexDirection: 'column', boxShadow: '4px 0 32px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1e2433', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9' }}>Chat History</span>
          <button onClick={() => setOpen(false)}
            style={{ width: 28, height: 28, borderRadius: 8, background: '#1e293b', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
            ✕
          </button>
        </div>

        {/* New Chat */}
        <div style={{ padding: '12px', flexShrink: 0 }}>
          <button
            onClick={() => { onSelect(`session_${Date.now()}`); setOpen(false); }}
            style={{ width: '100%', padding: '10px', borderRadius: 12, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ✏️ New Chat
          </button>
        </div>

        {/* Sessions */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 13 }}>Koi history nahi</div>
            </div>
          ) : sessions.map(s => (
            <div key={s.id}
              onClick={() => { onSelect(s.id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 8px',
                borderRadius: 10, marginBottom: 2, cursor: 'pointer',
                background: s.id === currentSession ? 'rgba(59,130,246,0.12)' : 'transparent',
                border: s.id === currentSession ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (s.id !== currentSession) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (s.id !== currentSession) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ color: '#475569', fontSize: 14, flexShrink: 0, marginTop: 1 }}>💬</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.preview || 'New chat'}
                </div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                  {new Date(s.ts).toLocaleDateString('hi-IN')} · {s.count} msgs
                </div>
              </div>
              <button onClick={e => deleteSession(s.id, e)}
                style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12 }}>
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Delete all */}
        <div style={{ padding: 12, borderTop: '1px solid #1e2433', flexShrink: 0 }}>
          <button
            onClick={async () => {
              if (!confirm('Sab history delete karein?')) return;
              const db = getDB();
              if (db) { await db.messages.clear(); setSessions([]); }
            }}
            style={{ width: '100%', padding: '8px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.7)', fontSize: 12, cursor: 'pointer' }}>
            🗑️ Sab Delete Karo
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 6px', color: '#475569', lineHeight: 1 }}
        title="Chat History">
        🕐
      </button>
      {drawer}
    </>
  );
}
