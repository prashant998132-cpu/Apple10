'use client';
import { useState } from 'react';
import { PersonalityMode } from '@/lib/intelligence';

interface Props {
  mode: string; onModeChange: (m: any) => void;
  personality: string; onPersonalityChange: (p: string) => void;
}

const MODES = [
  { id: 'auto',  icon: '🤖', label: 'Auto',  color: '#60a5fa' },
  { id: 'flash', icon: '⚡', label: 'Flash', color: '#facc15' },
  { id: 'think', icon: '🧠', label: 'Think', color: '#a78bfa' },
  { id: 'deep',  icon: '🔬', label: 'Deep',  color: '#34d399' },
];

const PERSONALITIES: { id: PersonalityMode; icon: string; label: string; color: string }[] = [
  { id: 'default',      icon: '🤖', label: 'JARVIS',      color: '#60a5fa' },
  { id: 'fun',          icon: '🎉', label: 'Fun',          color: '#f472b6' },
  { id: 'serious',      icon: '💼', label: 'Serious',      color: '#94a3b8' },
  { id: 'motivational', icon: '💪', label: 'Motivate',     color: '#fb923c' },
  { id: 'sarcastic',    icon: '😏', label: 'Sarcastic',    color: '#a78bfa' },
  { id: 'roast',        icon: '🔥', label: 'Roast',        color: '#f87171' },
  { id: 'philosopher',  icon: '🧘', label: 'Philosopher',  color: '#34d399' },
  { id: 'teacher',      icon: '📚', label: 'Teacher',      color: '#fbbf24' },
  { id: 'study',        icon: '🎯', label: 'Study',        color: '#22d3ee' },
  { id: 'code',         icon: '💻', label: 'Code',         color: '#86efac' },
];

export default function ModeBar({ mode, onModeChange, personality, onPersonalityChange }: Props) {
  const [showPersonality, setShowPersonality] = useState(false);
  const curP = PERSONALITIES.find(p => p.id === personality) || PERSONALITIES[0];

  return (
    <div style={{ padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, background: 'rgba(7,8,16,0.95)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>

        {/* Think modes */}
        {MODES.map(m => (
          <button key={m.id} onClick={() => onModeChange(m.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 9px', borderRadius: 8, border: '1px solid',
              fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s',
              borderColor: mode === m.id ? m.color : 'rgba(255,255,255,0.06)',
              background: mode === m.id ? m.color + '15' : 'transparent',
              color: mode === m.id ? m.color : '#475569',
            }}>
            <span>{m.icon}</span><span>{m.label}</span>
          </button>
        ))}

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.07)', flexShrink: 0, margin: '0 2px' }} />

        {/* Personality toggle */}
        <button onClick={() => setShowPersonality(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 9px', borderRadius: 8, border: '1px solid',
            borderColor: curP.color + '40', background: curP.color + '10',
            fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0, color: curP.color,
          }}>
          <span>{curP.icon}</span>
          <span>{curP.label}</span>
          <span style={{ fontSize: 7, opacity: 0.6 }}>▾</span>
        </button>

        {/* Personality popup */}
        {showPersonality && (
          <div style={{
            position: 'absolute', left: 12, top: 90, zIndex: 50,
            background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: 10, display: 'flex', flexWrap: 'wrap',
            gap: 6, maxWidth: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          }}>
            {PERSONALITIES.map(p => (
              <button key={p.id} onClick={() => { onPersonalityChange(p.id); setShowPersonality(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 10px', borderRadius: 10, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                  borderColor: personality === p.id ? p.color : 'rgba(255,255,255,0.07)',
                  background: personality === p.id ? p.color + '20' : 'rgba(255,255,255,0.03)',
                  color: personality === p.id ? p.color : '#94a3b8', fontSize: 11, fontWeight: 700,
                }}>
                <span>{p.icon}</span><span>{p.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
