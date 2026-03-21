'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ACTIONS = [
  { icon: '🌤️', label: 'Mausam', query: 'aaj ka mausam kya hai Maihar mein' },
  { icon: '🏏', label: 'Cricket', query: 'aaj ka cricket score dikhao' },
  { icon: '💰', label: 'Gold', query: 'aaj sone ka bhav kitna hai' },
  { icon: '📰', label: 'News', query: 'aaj ki top 3 India news batao' },
  { icon: '🧮', label: 'Calc', query: 'calculator kholo' },
  { icon: '⏱️', label: 'Timer', query: '5 minute ka timer set karo' },
  { icon: '🎵', label: 'Music', query: '/jarvis:open:spotify' },
  { icon: '📷', label: 'Camera', query: '/jarvis:open:camera' },
];

export default function QuickActions({ onQuery }: { onQuery: (q: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', right: 14, bottom: 80, zIndex: 200 }}>
      {/* Quick action grid */}
      {open && (
        <div style={{
          position: 'absolute', bottom: 56, right: 0,
          background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 12,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 8, width: 220,
          animation: 'popIn 0.2s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <style>{`@keyframes popIn{from{transform:scale(0.9) translateY(10px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}`}</style>
          {ACTIONS.map(a => (
            <button key={a.label}
              onClick={() => { onQuery(a.query); setOpen(false); }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '8px 4px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 18 }}>{a.icon}</span>
              <span style={{ fontSize: 9, color: '#6b7280', fontWeight: 600 }}>{a.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 46, height: 46,
          background: open ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
          border: open ? '1px solid rgba(239,68,68,0.3)' : 'none',
          borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
          boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          transition: 'all 0.2s',
          transform: open ? 'rotate(45deg)' : 'none',
        }}>
        {open ? '✕' : '⚡'}
      </button>
    </div>
  );
}
