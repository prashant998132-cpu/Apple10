'use client';
import { useState, useEffect } from 'react';

interface Stats {
  xp: number;
  level: number;
  streak: number;
  totalMessages: number;
  totalSessions: number;
  badges: string[];
  memories: number;
  aiCalls: number;
  imagesGenerated: number;
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem('jarvis_profile') || localStorage.getItem('jarvis-db-profile') || '{}';
    const profile = JSON.parse(raw);
    const xp = profile.xp || 0;
    const cloudMsgs = JSON.parse(localStorage.getItem('jarvis_cloud_messages') || '[]');
    const vectors = JSON.parse(localStorage.getItem('jarvis_vectors') || '[]');
    const images = JSON.parse(localStorage.getItem('jarvis_image_history') || '[]');
    return {
      xp,
      level: Math.floor(xp / 100) + 1,
      streak: profile.streak || 0,
      totalMessages: profile.totalMessages || profile.total_messages || cloudMsgs.length || 0,
      totalSessions: profile.totalSessions || 0,
      badges: profile.badges || [],
      memories: vectors.length,
      aiCalls: profile.totalMessages || 0,
      imagesGenerated: images.length,
    };
  } catch {
    return { xp: 0, level: 1, streak: 0, totalMessages: 0, totalSessions: 0, badges: [], memories: 0, aiCalls: 0, imagesGenerated: 0 };
  }
}

const HABITS = [
  { id: 'morning_jarvis', label: '🌅 Morning check-in', desc: 'JARVIS se subah baat karo' },
  { id: 'daily_goals', label: '🎯 Daily goals set', desc: 'Aaj ke goals define kiye' },
  { id: 'evening_review', label: '🌙 Evening review', desc: 'Din ka summary dekha' },
  { id: 'learning', label: '📚 Kuch seekha', desc: 'Koi naya concept/skill' },
  { id: 'exercise', label: '💪 Exercise', desc: 'Koi bhi physical activity' },
];

function loadHabits() {
  const key = 'jarvis_habits_' + new Date().toDateString();
  try { return JSON.parse(localStorage.getItem(key) || '{}'); }
  catch { return {}; }
}
function saveHabits(h: Record<string, boolean>) {
  const key = 'jarvis_habits_' + new Date().toDateString();
  try { localStorage.setItem(key, JSON.stringify(h)); } catch {}
}

function loadHabitHistory() {
  try { return JSON.parse(localStorage.getItem('jarvis_habit_history') || '[]'); }
  catch { return []; }
}

const LEVEL_NAMES: Record<number, string> = {
  1: '🌱 Seedling', 2: '🌿 Sprout', 3: '🌳 Explorer', 4: '⚡ Apprentice',
  5: '🔥 Warrior', 6: '💎 Expert', 7: '🚀 Master', 8: '👑 Legend',
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats>({ xp: 0, level: 1, streak: 0, totalMessages: 0, totalSessions: 0, badges: [], memories: 0, aiCalls: 0, imagesGenerated: 0 });
  const [habits, setHabits] = useState<Record<string, boolean>>({});
  const [habitHistory, setHabitHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<'stats'|'habits'>('stats');

  useEffect(() => {
    setStats(loadStats());
    setHabits(loadHabits());
    setHabitHistory(loadHabitHistory().slice(-7).reverse());
  }, []);

  const toggleHabit = (id: string) => {
    const updated = { ...habits, [id]: !habits[id] };
    setHabits(updated);
    saveHabits(updated);
    // Save to history
    const history = loadHabitHistory();
    const today = new Date().toDateString();
    const todayIdx = history.findIndex((h: any) => h.date === today);
    const entry = { date: today, completed: Object.values(updated).filter(Boolean).length, total: HABITS.length, habits: updated };
    if (todayIdx >= 0) history[todayIdx] = entry;
    else history.push(entry);
    try { localStorage.setItem('jarvis_habit_history', JSON.stringify(history.slice(-30))); } catch {}
    setHabitHistory(history.slice(-7).reverse());
  };

  const xpProgress = stats.xp % 100;
  const xpToNext = 100 - xpProgress;
  const levelName = LEVEL_NAMES[Math.min(stats.level, 8)] || '👑 Legend';
  const habitsToday = Object.values(habits).filter(Boolean).length;

  const STAT_CARDS = [
    { icon: '⚡', label: 'Total XP', value: stats.xp.toLocaleString('en-IN'), color: '#fbbf24' },
    { icon: '🔥', label: 'Day Streak', value: stats.streak + ' days', color: '#ef4444' },
    { icon: '💬', label: 'AI Conversations', value: stats.totalMessages.toLocaleString('en-IN'), color: '#22d3ee' },
    { icon: '🧠', label: 'Memories Stored', value: stats.memories.toString(), color: '#a78bfa' },
    { icon: '🎨', label: 'Images Generated', value: stats.imagesGenerated.toString(), color: '#ec4899' },
    { icon: '✅', label: 'Habits Today', value: habitsToday + '/' + HABITS.length, color: '#22c55e' },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: '#070810', color: '#e2e8f0', fontFamily: 'sans-serif', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#0a0c14', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24' }}>⚡ My Stats</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['stats', 'habits'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: tab === t ? 'rgba(251,191,36,0.15)' : 'transparent', color: tab === t ? '#fbbf24' : '#475569' }}>
              {t === 'stats' ? '📊 Stats' : '✅ Habits'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 14 }}>
        {tab === 'stats' ? (
          <>
            {/* Level card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(99,102,241,0.1))', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 16, padding: 16, marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Level</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Level {stats.level}</div>
              <div style={{ fontSize: 14, color: '#fbbf24', marginBottom: 12 }}>{levelName}</div>
              {/* XP bar */}
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: xpProgress + '%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: 99, transition: 'width 0.6s' }} />
              </div>
              <div style={{ fontSize: 10, color: '#475569' }}>{xpProgress}/100 XP — {xpToNext} more to Level {stats.level + 1}</div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {STAT_CARDS.map(card => (
                <div key={card.label} style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{card.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Badges */}
            {stats.badges.length > 0 && (
              <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 10 }}>🏅 Badges ({stats.badges.length})</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {stats.badges.map((b, i) => (
                    <div key={i} style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 12 }}>{b}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Storage usage */}
            <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>💾 Local Storage</div>
              {[
                ['jarvis_cloud_messages', 'Chat History'],
                ['jarvis_image_history', 'Image Gallery'],
                ['jarvis_notes', 'Notes'],
                ['jarvis_vectors', 'AI Memories'],
              ].map(([key, label]) => {
                let size = 0;
                try { size = new Blob([localStorage.getItem(key) || '']).size; } catch {}
                const kb = (size / 1024).toFixed(1);
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>{label}</span>
                    <span style={{ color: '#475569' }}>{kb} KB</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Habits today */}
            <div style={{ background: '#0d1117', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>✅ Aaj ke Habits — {habitsToday}/{HABITS.length}</div>
                <div style={{ fontSize: 11, color: '#374151' }}>{new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })}</div>
              </div>
              {/* Progress */}
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', width: (habitsToday / HABITS.length * 100) + '%', background: 'linear-gradient(90deg, #22c55e, #86efac)', borderRadius: 99, transition: 'width 0.4s' }} />
              </div>
              {HABITS.map(h => (
                <div key={h.id} onClick={() => toggleHabit(h.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                    borderColor: habits[h.id] ? '#22c55e' : 'rgba(255,255,255,0.15)', background: habits[h.id] ? '#22c55e' : 'transparent' }}>
                    {habits[h.id] && <span style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: habits[h.id] ? '#475569' : '#e2e8f0', textDecoration: habits[h.id] ? 'line-through' : 'none' }}>{h.label}</div>
                    <div style={{ fontSize: 10, color: '#374151' }}>{h.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Habit history */}
            {habitHistory.length > 0 && (
              <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', marginBottom: 12 }}>📅 Last 7 Days</div>
                {habitHistory.map((day: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 11, color: '#475569', width: 80 }}>{new Date(day.date).toLocaleDateString('hi-IN', { weekday: 'short', day: 'numeric' })}</div>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: (day.completed / day.total * 100) + '%', background: day.completed === day.total ? '#22c55e' : '#6366f1', borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 11, color: day.completed === day.total ? '#22c55e' : '#475569', width: 30, textAlign: 'right' }}>{day.completed}/{day.total}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
