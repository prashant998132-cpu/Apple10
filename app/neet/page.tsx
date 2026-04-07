'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// NEET 2026 exam date
const NEET_DATE = new Date('2026-05-03T00:00:00+05:30');

const CHAPTERS = {
  physics: [
    { name: 'Laws of Motion', marks: 3, done: false },
    { name: 'Work, Energy, Power', marks: 3, done: false },
    { name: 'Rotational Motion', marks: 3, done: false },
    { name: 'Thermodynamics', marks: 3, done: false },
    { name: 'Electrostatics', marks: 4, done: false },
    { name: 'Current Electricity', marks: 3, done: false },
    { name: 'Magnetism', marks: 3, done: false },
    { name: 'Optics', marks: 4, done: false },
    { name: 'Modern Physics', marks: 3, done: false },
    { name: 'Semiconductors', marks: 2, done: false },
  ],
  chemistry: [
    { name: 'Atomic Structure', marks: 2, done: false },
    { name: 'Chemical Bonding', marks: 3, done: false },
    { name: 'Equilibrium', marks: 3, done: false },
    { name: 'Electrochemistry', marks: 2, done: false },
    { name: 'Coordination Compounds', marks: 3, done: false },
    { name: 'Hydrocarbons', marks: 3, done: false },
    { name: 'Organic Chemistry', marks: 4, done: false },
    { name: 'd-f Block Elements', marks: 2, done: false },
    { name: 'Biomolecules', marks: 2, done: false },
    { name: 'Polymers', marks: 1, done: false },
  ],
  biology: [
    { name: 'Cell Structure', marks: 4, done: false },
    { name: 'Genetics', marks: 5, done: false },
    { name: 'Evolution', marks: 2, done: false },
    { name: 'Human Physiology', marks: 8, done: false },
    { name: 'Plant Physiology', marks: 4, done: false },
    { name: 'Reproduction', marks: 5, done: false },
    { name: 'Ecology', marks: 4, done: false },
    { name: 'Biotechnology', marks: 3, done: false },
    { name: 'Microbes', marks: 2, done: false },
    { name: 'Animal Kingdom', marks: 3, done: false },
  ],
};

const DAILY_TARGETS = [
  '📖 2 hours Physics',
  '⚗️ 1.5 hours Chemistry', 
  '🧬 2 hours Biology',
  '📝 30 MCQ practice',
  '🔁 Revision — 1 chapter',
];

type Subject = 'physics' | 'chemistry' | 'biology';

export default function NEETPage() {
  const router = useRouter();
  const [daysLeft, setDaysLeft] = useState(0);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [todayTargets, setTodayTargets] = useState<boolean[]>([false, false, false, false, false]);
  const [activeSubject, setActiveSubject] = useState<Subject>('physics');
  const [mockScore, setMockScore] = useState({ ph: '', ch: '', bi: '', res: '' });

  useEffect(() => {
    // Load saved progress
    try {
      const saved = localStorage.getItem('neet_progress');
      if (saved) setProgress(JSON.parse(saved));
    } catch {}
    const diff = NEET_DATE.getTime() - Date.now();
    setDaysLeft(Math.max(0, Math.floor(diff / 86400000)));
    // Load progress
    try {
      const p = JSON.parse(localStorage.getItem('neet_chapter_progress') || '{}');
      setProgress(p);
      const t = JSON.parse(localStorage.getItem('neet_today_' + new Date().toDateString()) || '[false,false,false,false,false]');
      setTodayTargets(t);
    } catch {}
  }, []);

  const toggleChapter = (subject: string, idx: number) => {
    const key = subject + '_' + idx;
    const newP = { ...progress, [key]: !progress[key] };
    setProgress(newP);
    try { localStorage.setItem('neet_chapter_progress', JSON.stringify(newP)); } catch {}
  };

  const toggleTarget = (idx: number) => {
    const newT = [...todayTargets];
    newT[idx] = !newT[idx];
    setTodayTargets(newT);
    try { localStorage.setItem('neet_today_' + new Date().toDateString(), JSON.stringify(newT)); } catch {}
  };

  const calcMock = () => {
    const ph = parseInt(mockScore.ph) || 0;
    const ch = parseInt(mockScore.ch) || 0;
    const bi = parseInt(mockScore.bi) || 0;
    const total = ph + ch + bi;
    const percentile = total >= 640 ? '99+' : total >= 600 ? '98-99' : total >= 550 ? '95-98' : total >= 500 ? '90-95' : total >= 450 ? '85-90' : '<85';
    setMockScore({ ...mockScore, res: `Total: ${total}/720\nPercentile: ~${percentile}\n${total >= 550 ? '✅ MBBS likely' : total >= 450 ? '⚠️ Keep pushing!' : '❌ Need more practice'}` });
  };

  const subjectProgress = (s: Subject) => {
    const chapters = CHAPTERS[s];
    const done = chapters.filter((_, i) => progress[s + '_' + i]).length;
    return { done, total: chapters.length, pct: Math.round(done / chapters.length * 100) };
  };

  const subjectColors: Record<Subject, string> = { physics: '#60a5fa', chemistry: '#34d399', biology: '#f87171' };
  const subjectIcons: Record<Subject, string> = { physics: '⚛️', chemistry: '⚗️', biology: '🧬' };

  const totalChapters = Object.values(CHAPTERS).flat().length;
  const totalDone = Object.entries(CHAPTERS).reduce((acc, [s, chs]) =>
    acc + chs.filter((_, i) => progress[s + '_' + i]).length, 0);
  const overallPct = Math.round(totalDone / totalChapters * 100);

  return (
    <div style={{ background: '#070810', minHeight: '100dvh', color: '#e2e8f0', fontFamily: 'sans-serif', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#0a0c14', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#f87171' }}>🎯 NEET 2026</div>
        <button onClick={() => router.push('/study')}
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#818cf8', padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
          📚 Study Mode
        </button>
      </div>

      <div style={{ padding: 14 }}>

        {/* Countdown + Overall */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(99,102,241,0.1))', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#f87171', lineHeight: 1 }}>{daysLeft}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>days to NEET 2026</div>
            <div style={{ fontSize: 9, color: '#374151', marginTop: 2 }}>~3 May 2026</div>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: overallPct >= 70 ? '#22c55e' : '#fbbf24', lineHeight: 1 }}>{overallPct}%</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>syllabus covered</div>
            <div style={{ fontSize: 9, color: '#374151' }}>{totalDone}/{totalChapters} chapters</div>
          </div>
        </div>

        {/* Today's Targets */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', marginBottom: 10 }}>⚡ Aaj ke Targets — {todayTargets.filter(Boolean).length}/{DAILY_TARGETS.length} Done</div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: (todayTargets.filter(Boolean).length / DAILY_TARGETS.length * 100) + '%', background: 'linear-gradient(90deg, #fbbf24, #22c55e)', borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
          {DAILY_TARGETS.map((t, i) => (
            <div key={i} onClick={() => toggleTarget(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < DAILY_TARGETS.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', cursor: 'pointer' }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, border: '1px solid', borderColor: todayTargets[i] ? '#22c55e' : 'rgba(255,255,255,0.15)', background: todayTargets[i] ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                {todayTargets[i] && <span style={{ fontSize: 11, color: '#fff' }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: todayTargets[i] ? '#475569' : '#e2e8f0', textDecoration: todayTargets[i] ? 'line-through' : 'none' }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Chapter Progress */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#818cf8', marginBottom: 12 }}>📋 Chapter Tracker</div>

          {/* Subject tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['physics', 'chemistry', 'biology'] as Subject[]).map(s => {
              const p = subjectProgress(s);
              return (
                <button key={s} onClick={() => setActiveSubject(s)}
                  style={{ flex: 1, padding: '6px 4px', borderRadius: 9, border: '1px solid', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: activeSubject === s ? subjectColors[s] : 'rgba(255,255,255,0.07)',
                    background: activeSubject === s ? subjectColors[s] + '15' : 'transparent' }}>
                  <div style={{ fontSize: 14 }}>{subjectIcons[s]}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: activeSubject === s ? subjectColors[s] : '#475569', marginTop: 2, textTransform: 'capitalize' }}>{s}</div>
                  <div style={{ fontSize: 9, color: '#374151' }}>{p.done}/{p.total}</div>
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          {(() => {
            const p = subjectProgress(activeSubject);
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>{p.done}/{p.total} chapters</span>
                  <span style={{ fontSize: 10, color: subjectColors[activeSubject], fontWeight: 700 }}>{p.pct}%</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ height: '100%', width: p.pct + '%', background: subjectColors[activeSubject], borderRadius: 99, transition: 'width 0.4s' }} />
                </div>
              </>
            );
          })()}

          {/* Chapter list */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {CHAPTERS[activeSubject].map((ch, i) => {
              const done = progress[activeSubject + '_' + i];
              return (
                <div key={i} onClick={() => toggleChapter(activeSubject, i)}
                  style={{ padding: '8px 10px', borderRadius: 9, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: done ? subjectColors[activeSubject] : 'rgba(255,255,255,0.07)',
                    background: done ? subjectColors[activeSubject] + '10' : 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, color: done ? subjectColors[activeSubject] : '#94a3b8', lineHeight: 1.4, flex: 1 }}>{ch.name}</span>
                    <span style={{ fontSize: 9, color: done ? subjectColors[activeSubject] : '#374151', marginLeft: 4, flexShrink: 0 }}>{done ? '✓' : ch.marks + 'M'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mock Score Calculator */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#22d3ee', marginBottom: 12 }}>🧮 Mock Score → Percentile</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[['ph', '⚛️ Physics', '/180'], ['ch', '⚗️ Chem', '/180'], ['bi', '🧬 Biology', '/360']].map(([key, label, max]) => (
              <div key={key}>
                <div style={{ fontSize: 9, color: '#475569', marginBottom: 4 }}>{label} {max}</div>
                <input type="number" value={mockScore[key as 'ph'|'ch'|'bi']} onChange={e => setMockScore({ ...mockScore, [key]: e.target.value })}
                  placeholder="0"
                  style={{ width: '100%', background: '#070810', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px', color: '#e2e8f0', fontSize: 13, outline: 'none', textAlign: 'center' }} />
              </div>
            ))}
          </div>
          <button onClick={calcMock}
            style={{ width: '100%', padding: 11, background: 'linear-gradient(135deg, #22d3ee, #6366f1)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
            Calculate Percentile
          </button>
          {mockScore.res && (
            <div style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, padding: 12 }}>
              <pre style={{ margin: 0, fontSize: 13, color: '#22d3ee', lineHeight: 1.7 }}>{mockScore.res}</pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
