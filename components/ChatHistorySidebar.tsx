'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getDB } from '@/lib/db';

interface Session { id: string; title: string; preview: string; ts: number; count: number; }
interface Props { onSelect: (sessionId: string) => void; currentSession: string; }

function groupByDate(sessions: Session[]) {
  const now = Date.now();
  const DAY = 86400000;
  const groups: Record<string, Session[]> = { 'Aaj': [], 'Kal': [], 'Is Hafte': [], 'Pehle': [] };
  for (const s of sessions) {
    const diff = now - s.ts;
    if (diff < DAY) groups['Aaj'].push(s);
    else if (diff < 2 * DAY) groups['Kal'].push(s);
    else if (diff < 7 * DAY) groups['Is Hafte'].push(s);
    else groups['Pehle'].push(s);
  }
  return groups;
}

export default function ChatHistorySidebar({ onSelect, currentSession }: Props) {
  const [open, setOpen]       = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mounted, setMounted]  = useState(false);

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
      if (m.role === 'user' && !s.title) s.title = m.content.slice(0, 40);
      if (m.role === 'user' && !s.preview) s.preview = m.content.slice(0, 50);
    }
    setSessions([...map.values()].sort((a, b) => b.ts - a.ts).slice(0, 40));
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

  const groups = groupByDate(sessions);

  const drawer = open && mounted ? createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:99999 }}>
      {/* Backdrop */}
      <div onClick={() => setOpen(false)}
        style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)' }} />

      {/* Sidebar panel */}
      <div style={{
        position:'absolute', top:0, left:0, bottom:0, width:'280px',
        background:'#0d0f18', borderRight:'1px solid rgba(255,255,255,0.07)',
        display:'flex', flexDirection:'column', boxShadow:'8px 0 40px rgba(0,0,0,0.7)',
        animation:'slideIn 0.22s cubic-bezier(0.4,0,0.2,1)'
      }}>
        <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>

        {/* ── Header ── */}
        <div style={{ padding:'16px 14px 12px', flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:'#f1f5f9', letterSpacing:'-0.3px' }}>🤖 JARVIS</div>
              <div style={{ fontSize:10, color:'#475569', marginTop:1 }}>Chat History</div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#6b7280', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>
              ✕
            </button>
          </div>

          {/* New Chat button */}
          <button onClick={newChat}
            style={{ width:'100%', padding:'10px 14px', borderRadius:12, background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.25)', color:'#60a5fa', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, transition:'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background='rgba(59,130,246,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background='rgba(59,130,246,0.12)')}>
            <span>✏️</span> Naya Chat
          </button>
        </div>

        {/* ── Sessions list ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px 8px' }}>
          {sessions.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'#374151' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>💬</div>
              <div style={{ fontSize:13 }}>Koi history nahi abhi</div>
              <div style={{ fontSize:11, marginTop:4, color:'#1f2937' }}>Pehla message bhejo!</div>
            </div>
          ) : (
            Object.entries(groups).map(([label, items]) => items.length === 0 ? null : (
              <div key={label}>
                <div style={{ fontSize:10, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.08em', padding:'8px 8px 4px' }}>
                  {label}
                </div>
                {items.map(s => (
                  <div key={s.id}
                    onClick={() => { onSelect(s.id); setOpen(false); }}
                    style={{
                      display:'flex', alignItems:'center', gap:8, padding:'9px 10px',
                      borderRadius:10, marginBottom:1, cursor:'pointer', transition:'all 0.12s',
                      background: s.id === currentSession ? 'rgba(59,130,246,0.12)' : 'transparent',
                      border: `1px solid ${s.id === currentSession ? 'rgba(59,130,246,0.2)' : 'transparent'}`,
                    }}
                    onMouseEnter={e => { if(s.id!==currentSession)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if(s.id!==currentSession)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color: s.id===currentSession?'#93c5fd':'#d1d5db', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight: s.id===currentSession?600:400 }}>
                        {s.title || 'Naya chat'}
                      </div>
                      <div style={{ fontSize:10, color:'#374151', marginTop:2 }}>
                        {s.count} msgs · {new Date(s.ts).toLocaleTimeString('hi-IN',{hour:'2-digit',minute:'2-digit'})}
                      </div>
                    </div>
                    <button onClick={e => del(s.id, e)}
                      style={{ flexShrink:0, width:26, height:26, borderRadius:7, background:'none', border:'none', color:'#374151', cursor:'pointer', fontSize:12, opacity:0, transition:'opacity 0.15s', display:'flex', alignItems:'center', justifyContent:'center' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity='1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity='0')}
                      className="del-btn">
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* ── Footer — only JARVIS branding, no settings/export ── */}
        <div style={{ padding:'10px 14px 14px', borderTop:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
          <div style={{ textAlign:'center', fontSize:11, color:'#1f2937' }}>JARVIS · ₹0 Forever 🔒</div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ background:'none', border:'none', cursor:'pointer', fontSize:17, padding:'4px 6px', color:'#4b5563', lineHeight:1, transition:'color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.color='#9ca3af')}
        onMouseLeave={e => (e.currentTarget.style.color='#4b5563')}
        title="Chat History">
        🕐
      </button>
      {drawer}
    </>
  );
}
