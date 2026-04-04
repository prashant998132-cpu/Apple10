'use client';
import { useState, useEffect } from 'react';

interface Achievement {
  id: string;
  title: string;
  xp: number;
  icon: string;
}

let showAchievement: ((a: Achievement) => void) | null = null;

export function triggerAchievement(title: string, xp: number, icon = '🏆') {
  showAchievement?.({ id: `a_${Date.now()}`, title, xp, icon });
}

export default function AchievementToast() {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);

  useEffect(() => {
    showAchievement = (a) => setQueue(q => [...q, a]);
    return () => { showAchievement = null; };
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(q => q.slice(1));
      setTimeout(() => setCurrent(null), 3500);
    }
  }, [queue, current]);

  if (!current) return null;

  return (
    <div style={{
      position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, pointerEvents: 'none',
      animation: 'achievementPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
    }}>
      <style>{`
        @keyframes achievementPop {
          from { opacity:0; transform:translateX(-50%) translateY(-20px) scale(0.8); }
          to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
      <div style={{
        background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
        border: '1px solid rgba(165,180,252,0.4)',
        borderRadius: 99, padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
        backdropFilter: 'blur(12px)',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 22 }}>{current.icon}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#e0e7ff' }}>{current.title}</div>
          <div style={{ fontSize: 10, color: '#a5b4fc' }}>+{current.xp} XP earned!</div>
        </div>
        <div style={{
          background: 'rgba(165,180,252,0.15)', border: '1px solid rgba(165,180,252,0.3)',
          borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 800, color: '#c7d2fe',
        }}>🎉</div>
      </div>
    </div>
  );
}
