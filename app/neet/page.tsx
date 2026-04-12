'use client';
import { useState, useEffect, useCallback } from 'react';

const NEET_DATE = new Date('2026-05-03T00:00:00+05:30');

interface Chapter { name: string; marks: number; done: boolean; revision: number; }
interface Subject { chapters: Chapter[]; color: string; icon: string; }

const SYLLABUS: Record<string, Subject> = {
  Physics: {
    color: '#60a5fa', icon: '⚛️',
    chapters: [
      { name: 'Laws of Motion', marks: 3, done: false, revision: 0 },
      { name: 'Work, Energy & Power', marks: 3, done: false, revision: 0 },
      { name: 'Rotational Motion', marks: 3, done: false, revision: 0 },
      { name: 'Thermodynamics', marks: 3, done: false, revision: 0 },
      { name: 'Electrostatics', marks: 4, done: false, revision: 0 },
      { name: 'Current Electricity', marks: 3, done: false, revision: 0 },
      { name: 'Magnetic Effects', marks: 3, done: false, revision: 0 },
      { name: 'Ray Optics', marks: 3, done: false, revision: 0 },
      { name: 'Wave Optics', marks: 2, done: false, revision: 0 },
      { name: 'Modern Physics', marks: 3, done: false, revision: 0 },
      { name: 'Semiconductors', marks: 2, done: false, revision: 0 },
      { name: 'Kinematics', marks: 2, done: false, revision: 0 },
    ],
  },
  Chemistry: {
    color: '#34d399', icon: '🧪',
    chapters: [
      { name: 'Atomic Structure', marks: 2, done: false, revision: 0 },
      { name: 'Chemical Bonding', marks: 3, done: false, revision: 0 },
      { name: 'Equilibrium', marks: 3, done: false, revision: 0 },
      { name: 'Electrochemistry', marks: 2, done: false, revision: 0 },
      { name: 'Coordination Compounds', marks: 3, done: false, revision: 0 },
      { name: 'Hydrocarbons', marks: 3, done: false, revision: 0 },
      { name: 'Organic Chemistry (Basics)', marks: 4, done: false, revision: 0 },
      { name: 'd & f Block Elements', marks: 2, done: false, revision: 0 },
      { name: 'Biomolecules', marks: 2, done: false, revision: 0 },
      { name: 'Polymers', marks: 1, done: false, revision: 0 },
      { name: 'p-Block Elements', marks: 3, done: false, revision: 0 },
      { name: 'Chemical Kinetics', marks: 2, done: false, revision: 0 },
    ],
  },
  Biology: {
    color: '#f87171', icon: '🧬',
    chapters: [
      { name: 'Cell Biology', marks: 5, done: false, revision: 0 },
      { name: 'Genetics & Heredity', marks: 6, done: false, revision: 0 },
      { name: 'Human Physiology', marks: 8, done: false, revision: 0 },
      { name: 'Plant Physiology', marks: 5, done: false, revision: 0 },
      { name: 'Reproduction', marks: 5, done: false, revision: 0 },
      { name: 'Evolution', marks: 3, done: false, revision: 0 },
      { name: 'Ecology', marks: 4, done: false, revision: 0 },
      { name: 'Biotechnology', marks: 3, done: false, revision: 0 },
      { name: 'Biological Classification', marks: 2, done: false, revision: 0 },
      { name: 'Structural Organisation', marks: 2, done: false, revision: 0 },
      { name: 'Biomolecules (Bio)', marks: 3, done: false, revision: 0 },
      { name: 'Animal Kingdom', marks: 2, done: false, revision: 0 },
    ],
  },
};

const S = {
  page: { minHeight:'100vh', background:'#070810', color:'#e2e8f0', fontFamily:'-apple-system,sans-serif', paddingBottom:80 },
  header: { display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'#0a0c14', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'sticky' as const, top:0, zIndex:50 },
  back: { background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, color:'#e2e8f0', padding:'6px 12px', cursor:'pointer', fontSize:14 },
  card: { background:'#0d1117', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'12px 14px', marginBottom:10 },
};

function formatCountdown(ms: number) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return { d, h, m };
}

export default function NEETPage() {
  const [syllabus, setSyllabus] = useState(SYLLABUS);
  const [activeSubject, setActiveSubject] = useState('Biology');
  const [countdown, setCountdown] = useState(NEET_DATE.getTime() - Date.now());
  const [tab, setTab] = useState<'chapters'|'stats'|'target'>('chapters');
  const [targetScore, setTargetScore] = useState('600');
  const [dailyHours, setDailyHours] = useState('8');
  const [timerActive, setTimerActive] = useState(false);
  const [timerSecs, setTimerSecs] = useState(0);
  const [timerMode, setTimerMode] = useState<'pomodoro'|'study'>('pomodoro');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jarvis_neet_syllabus');
      if (saved) setSyllabus(JSON.parse(saved));
    } catch {}
    const t = setInterval(() => setCountdown(NEET_DATE.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (timerActive) {
      t = setInterval(() => setTimerSecs(s => {
        const limit = timerMode === 'pomodoro' ? 25*60 : 50*60;
        if (s >= limit - 1) { setTimerActive(false); return 0; }
        return s + 1;
      }), 1000);
    }
    return () => clearInterval(t);
  }, [timerActive, timerMode]);

  function save(updated: typeof SYLLABUS) {
    setSyllabus(updated);
    try { localStorage.setItem('jarvis_neet_syllabus', JSON.stringify(updated)); } catch {}
  }

  function toggleDone(subj: string, idx: number) {
    const u = { ...syllabus };
    u[subj].chapters[idx].done = !u[subj].chapters[idx].done;
    save(u);
  }

  function addRevision(subj: string, idx: number) {
    const u = { ...syllabus };
    u[subj].chapters[idx].revision = (u[subj].chapters[idx].revision || 0) + 1;
    save(u);
  }

  // Stats
  const allChapters = Object.entries(syllabus).flatMap(([,v]) => v.chapters);
  const doneChapters = allChapters.filter(c => c.done).length;
  const totalChapters = allChapters.length;
  const donePct = Math.round(doneChapters / totalChapters * 100);
  const totalMarksAvailable = Object.entries(syllabus).flatMap(([,v]) => v.chapters).filter(c => c.done).reduce((a, c) => a + c.marks, 0);
  const maxMarks = 720;
  const daysLeft = Math.ceil(countdown / 86400000);
  const { d, h, m } = formatCountdown(Math.max(0, countdown));

  // Score predictor
  const predictedScore = Math.min(maxMarks, Math.round((doneChapters / totalChapters) * maxMarks * 0.75));
  const targetNum = parseInt(targetScore) || 600;
  const gapScore = targetNum - predictedScore;
  const chaptersPerDay = daysLeft > 0 ? ((totalChapters - doneChapters) / daysLeft).toFixed(1) : '0';

  const timerPct = timerSecs / ((timerMode === 'pomodoro' ? 25 : 50) * 60) * 100;
  const timerDisplay = `${String(Math.floor(timerSecs/60)).padStart(2,'0')}:${String(timerSecs%60).padStart(2,'0')}`;

  const tabStyle = (t2: string) => ({
    padding:'8px 16px', border:'none',
    background: tab === t2 ? 'rgba(248,113,113,0.15)' : 'none',
    borderRadius:99, color: tab === t2 ? '#f87171' : '#6b7280',
    fontWeight:700, fontSize:12, cursor:'pointer',
    border: tab === t2 ? '1px solid rgba(248,113,113,0.3)' : '1px solid transparent',
  } as const);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.back} onClick={() => window.history.back()}>← Back</button>
        <span style={{ fontSize:16, fontWeight:900, color:'#f87171' }}>🎓 NEET 2026</span>
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#f87171' }}>{d}d {h}h {m}m</div>
          <div style={{ fontSize:9, color:'#374151' }}>Baaki hai</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, padding:'10px 12px', overflowX:'auto' }}>
        {(['chapters','stats','target'] as const).map(t2 => (
          <button key={t2} style={tabStyle(t2)} onClick={() => setTab(t2)}>
            {t2 === 'chapters' ? '📚 Chapters' : t2 === 'stats' ? '📊 Stats' : '🎯 Target'}
          </button>
        ))}
      </div>

      <div style={{ padding:'0 12px' }}>

        {/* CHAPTERS TAB */}
        {tab === 'chapters' && (<>
          {/* Progress bar */}
          <div style={S.card}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:700 }}>Overall Progress</span>
              <span style={{ fontSize:12, color:'#f87171', fontWeight:800 }}>{donePct}% ({doneChapters}/{totalChapters})</span>
            </div>
            <div style={{ height:8, background:'rgba(255,255,255,0.07)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width: donePct + '%', background:'linear-gradient(90deg,#f87171,#f59e0b)', borderRadius:99, transition:'width 0.4s' }}/>
            </div>
          </div>

          {/* Subject tabs */}
          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            {Object.entries(syllabus).map(([subj, data]) => {
              const done = data.chapters.filter(c=>c.done).length;
              const total = data.chapters.length;
              return (
                <button key={subj} onClick={() => setActiveSubject(subj)}
                  style={{ flex:1, padding:'8px 4px', borderRadius:10, border:`1px solid ${activeSubject===subj?data.color:'rgba(255,255,255,0.07)'}`, background:activeSubject===subj?`${data.color}18`:'rgba(255,255,255,0.03)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <span style={{ fontSize:16 }}>{data.icon}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:activeSubject===subj?data.color:'#6b7280' }}>{subj}</span>
                  <span style={{ fontSize:8, color:'#374151' }}>{done}/{total}</span>
                </button>
              );
            })}
          </div>

          {/* Chapter list */}
          {syllabus[activeSubject].chapters.map((ch, i) => (
            <div key={ch.name} style={{ background:'#0d1117', border:`1px solid ${ch.done?syllabus[activeSubject].color+'40':'rgba(255,255,255,0.06)'}`, borderRadius:12, padding:'10px 12px', marginBottom:7, display:'flex', alignItems:'center', gap:10 }}>
              <button onClick={() => toggleDone(activeSubject, i)}
                style={{ minWidth:22, height:22, borderRadius:6, border:`2px solid ${ch.done?syllabus[activeSubject].color:'rgba(255,255,255,0.2)'}`, background:ch.done?syllabus[activeSubject].color:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {ch.done && <span style={{ fontSize:11, color:'#0a0a0a', fontWeight:900 }}>✓</span>}
              </button>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:ch.done?'#6b7280':'#e2e8f0', textDecoration:ch.done?'line-through':'none' }}>{ch.name}</div>
                <div style={{ display:'flex', gap:6, marginTop:3 }}>
                  <span style={{ fontSize:10, color:'#374151' }}>~{ch.marks} marks</span>
                  {ch.revision > 0 && <span style={{ fontSize:10, color:'#f59e0b' }}>🔄 Rev ×{ch.revision}</span>}
                </div>
              </div>
              <button onClick={() => addRevision(activeSubject, i)}
                style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:7, color:'#f59e0b', fontSize:10, padding:'4px 8px', cursor:'pointer', fontWeight:700 }}>
                +Rev
              </button>
            </div>
          ))}

          {/* Study Timer */}
          <div style={{ ...S.card, marginTop:4, textAlign:'center' }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#374151', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Study Timer</div>
            <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:12 }}>
              {(['pomodoro','study'] as const).map(m2 => (
                <button key={m2} onClick={() => { setTimerMode(m2); setTimerSecs(0); setTimerActive(false); }}
                  style={{ padding:'5px 14px', borderRadius:99, border:'1px solid rgba(255,255,255,0.08)', background:timerMode===m2?'rgba(248,113,113,0.15)':'none', color:timerMode===m2?'#f87171':'#6b7280', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                  {m2==='pomodoro'?'🍅 25min':'📖 50min'}
                </button>
              ))}
            </div>
            <div style={{ fontSize:48, fontWeight:900, color:timerActive?'#f87171':'#e2e8f0', letterSpacing:'-2px', marginBottom:6 }}>{timerDisplay}</div>
            <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:99, overflow:'hidden', marginBottom:12 }}>
              <div style={{ height:'100%', width:timerPct+'%', background:'#f87171', borderRadius:99, transition:'width 1s linear' }}/>
            </div>
            <button onClick={() => setTimerActive(a => !a)}
              style={{ background:timerActive?'rgba(239,68,68,0.2)':'rgba(248,113,113,0.15)', border:`1px solid ${timerActive?'rgba(239,68,68,0.4)':'rgba(248,113,113,0.3)'}`, borderRadius:10, color:timerActive?'#ef4444':'#f87171', padding:'9px 24px', fontWeight:800, fontSize:14, cursor:'pointer' }}>
              {timerActive ? '⏸ Pause' : timerSecs > 0 ? '▶ Resume' : '▶ Start'}
            </button>
            {timerSecs > 0 && (
              <button onClick={() => { setTimerSecs(0); setTimerActive(false); }}
                style={{ background:'none', border:'none', color:'#374151', fontSize:12, marginLeft:12, cursor:'pointer' }}>Reset</button>
            )}
          </div>
        </>)}

        {/* STATS TAB */}
        {tab === 'stats' && (<>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            {[
              { label:'Chapters Done', value:doneChapters+'/'+totalChapters, color:'#22c55e' },
              { label:'Completion', value:donePct+'%', color:'#f87171' },
              { label:'Days Left', value:daysLeft, color:'#f59e0b' },
              { label:'Predicted Score', value:'~'+predictedScore, color:'#60a5fa' },
            ].map(s => (
              <div key={s.label} style={{ ...S.card, textAlign:'center', marginBottom:0 }}>
                <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10, color:'#374151', marginTop:3, fontWeight:700 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Per-subject progress */}
          {Object.entries(syllabus).map(([subj, data]) => {
            const done = data.chapters.filter(c=>c.done).length;
            const total = data.chapters.length;
            const pct = Math.round(done/total*100);
            return (
              <div key={subj} style={{ ...S.card, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:700 }}>{data.icon} {subj}</span>
                  <span style={{ fontSize:12, color:data.color, fontWeight:800 }}>{pct}% ({done}/{total})</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:pct+'%', background:data.color, borderRadius:99, transition:'width 0.4s' }}/>
                </div>
              </div>
            );
          })}

          {/* Revision stats */}
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:800, color:'#374151', textTransform:'uppercase', marginBottom:8 }}>Chapters Revised</div>
            {allChapters.filter(c=>c.revision>0).length === 0
              ? <div style={{ fontSize:12, color:'#374151' }}>Abhi koi revision nahi — chapters pe +Rev dabao!</div>
              : allChapters.filter(c=>c.revision>0).map(c=>(
                <div key={c.name} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:12 }}>
                  <span style={{ color:'#9ca3af' }}>{c.name}</span>
                  <span style={{ color:'#f59e0b', fontWeight:700 }}>×{c.revision}</span>
                </div>
              ))
            }
          </div>
        </>)}

        {/* TARGET TAB */}
        {tab === 'target' && (<>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:800, color:'#374151', textTransform:'uppercase', marginBottom:10 }}>Score Target Calculator</div>
            <div style={{ marginBottom:10 }}>
              <span style={{ fontSize:11, color:'#6b7280' }}>Target Score (out of 720)</span>
              <input type="number" value={targetScore} onChange={e=>setTargetScore(e.target.value)}
                style={{ width:'100%', background:'#070810', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'#e2e8f0', fontSize:14, outline:'none', marginTop:4 }}/>
            </div>
            <div>
              <span style={{ fontSize:11, color:'#6b7280' }}>Daily Study Hours</span>
              <input type="number" value={dailyHours} onChange={e=>setDailyHours(e.target.value)}
                style={{ width:'100%', background:'#070810', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'#e2e8f0', fontSize:14, outline:'none', marginTop:4 }}/>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:800, color:'#374151', textTransform:'uppercase', marginBottom:10 }}>Your Situation</div>
            {[
              { label:'Target Score', value:targetNum+'/720', color:'#f59e0b' },
              { label:'Current Predicted', value:'~'+predictedScore+'/720', color:'#60a5fa' },
              { label:'Gap to fill', value:gapScore > 0 ? '+'+gapScore+' marks needed' : '✅ On track!', color:gapScore>0?'#ef4444':'#22c55e' },
              { label:'Chapters/Day needed', value:chaptersPerDay+' chapters/day', color:'#a78bfa' },
              { label:'Days Remaining', value:daysLeft+' days', color:'#f87171' },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:12, color:'#9ca3af' }}>{r.label}</span>
                <span style={{ fontSize:13, fontWeight:800, color:r.color }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div style={{ ...S.card, background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.15)' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#f87171', marginBottom:6 }}>💡 Strategy</div>
            <div style={{ fontSize:12, color:'#9ca3af', lineHeight:1.7 }}>
              {daysLeft <= 10
                ? '⚡ Last sprint! Sirf revision karo — naya chapter mat pakdo. Mock tests do.'
                : daysLeft <= 30
                ? '🔥 Last month! Biology pe focus karo (most marks). Daily 2 mock tests.'
                : donePct < 50
                ? '📚 Abhi syllabus cover karo — ek chapter daily minimum. Biology pehle.'
                : '✅ Good progress! Weak chapters pe revision shuru karo.'}
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
}
