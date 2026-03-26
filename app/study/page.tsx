'use client';
import { useState, useEffect, useRef } from 'react';

const NEET_SUBJECTS = [
  { id: 'physics', label: 'Physics', icon: '⚛️', color: '#60a5fa' },
  { id: 'chemistry', label: 'Chemistry', icon: '⚗️', color: '#34d399' },
  { id: 'biology', label: 'Biology', icon: '🧬', color: '#f87171' },
  { id: 'botany', label: 'Botany', icon: '🌿', color: '#86efac' },
  { id: 'zoology', label: 'Zoology', icon: '🦁', color: '#fbbf24' },
];

const MODES = [
  { id: 'mcq', label: '📝 MCQ', desc: '5 practice questions' },
  { id: 'flashcard', label: '🃏 Flashcards', desc: 'Key concepts' },
  { id: 'explain', label: '💡 Explain', desc: 'Deep concept' },
  { id: 'formula', label: '∑ Formulas', desc: 'Important formulas' },
  { id: 'pyq', label: '📋 PYQ', desc: 'Previous year Q' },
];

const TOPICS: Record<string, string[]> = {
  physics: ['Mechanics', 'Thermodynamics', 'Optics', 'Electrostatics', 'Magnetism', 'Modern Physics', 'Waves', 'Work-Energy'],
  chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Electrochemistry', 'Coordination', 'Equilibrium'],
  biology: ['Cell Biology', 'Genetics', 'Evolution', 'Human Physiology', 'Reproduction', 'Ecology', 'Biotechnology'],
  botany: ['Plant Physiology', 'Morphology', 'Anatomy', 'Reproduction in Plants', 'Ecology'],
  zoology: ['Animal Kingdom', 'Human Physiology', 'Excretion', 'Neural Control', 'Reproductive Health'],
};

interface Score { subject: string; correct: number; total: number; date: string; }

function getScores(): Score[] {
  try { return JSON.parse(localStorage.getItem('jarvis_study_scores') || '[]'); }
  catch { return []; }
}
function saveScore(s: Score) {
  const scores = getScores();
  scores.push(s);
  try { localStorage.setItem('jarvis_study_scores', JSON.stringify(scores.slice(-50))); } catch {}
}

export default function StudyPage() {
  const [subject, setSubject] = useState('physics');
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('mcq');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<Score[]>([]);
  const [tab, setTab] = useState<'study'|'scores'>('study');
  const [timer, setTimer] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => { setScores(getScores().slice(-10).reverse()); }, [result]);

  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerOn]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const generate = async () => {
    if (!subject) return;
    setLoading(true);
    setResult('');
    setTimerOn(true);
    setTimer(0);

    const topicStr = topic ? ' — specifically ' + topic : '';
    const prompts: Record<string, string> = {
      mcq: `NEET ${subject}${topicStr} ke liye 5 MCQ questions banao.\nFormat:\nQ1. [question]\nA) B) C) D) options\nCorrect: [letter]\nExplanation: [1-2 lines Hinglish mein]\n\nQ2... (similarly)`,
      flashcard: `NEET ${subject}${topicStr} ke liye 5 important flashcards banao.\nFormat:\nCARD 1\nFRONT: [concept/term]\nBACK: [definition + key points]\n\nCARD 2... (similarly)`,
      explain: `NEET ${subject}${topicStr} ka most important concept explain karo.\nHinglish mein, simple examples ke saath.\n3-4 paragraphs. NEET ke point of view se important kya hai yeh bhi batao.`,
      formula: `NEET ${subject}${topicStr} ke sabse important formulas/facts:\n- Har formula ka naam\n- Formula\n- Kab use karte hain (1 line)\n- Units if applicable\n20 most important list karo.`,
      pyq: `NEET previous year ${subject}${topicStr} se 3 important questions:\nQ1. [actual-style question]\nOptions: A) B) C) D)\nAnswer: [letter]\nExplanation: [brief]\n\nQ2... Q3... similarly`,
    };

    try {
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompts[mode] }],
          system: 'You are a NEET expert teacher. Reply in Hinglish (Hindi+English). Be accurate, concise, exam-focused. Use proper formatting.',
          mode: 'think',
        }),
      });
      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value);
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const p = JSON.parse(data);
            // Handle both formats
            const chunk = p?.choices?.[0]?.delta?.content || p?.text || '';
            if (chunk) { text += chunk; setResult(text); }
          } catch {}
        }
      }
      setTimerOn(false);
      // Auto-save score for MCQ mode
      if (mode === 'mcq' && text) {
        const correct = (text.match(/Correct:/gi) || []).length;
        saveScore({ subject, correct, total: 5, date: new Date().toLocaleDateString('hi-IN') });
      }
    } catch {
      setResult('Error aaya. Internet check karo ya retry karo.');
      setTimerOn(false);
    }
    setLoading(false);
  };

  const subj = NEET_SUBJECTS.find(s => s.id === subject)!;

  return (
    <div style={{ minHeight: '100dvh', background: '#070810', color: '#e2e8f0', fontFamily: 'sans-serif', paddingBottom: 70 }}>
      {/* Header */}
      <div style={{ background: '#0a0c14', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#22d3ee' }}>📚 NEET Study</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontFamily: 'monospace', color: timerOn ? '#22c55e' : '#374151', fontWeight: 700 }}>{fmt(timer)}</div>
          <div style={{ display: 'flex', gap: 2 }}>
            {(['study', 'scores'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === t ? '#818cf8' : '#475569' }}>
                {t === 'study' ? '📖 Study' : '📊 Scores'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 14 }}>
        {tab === 'study' ? (
          <>
            {/* Subject selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto' }}>
              {NEET_SUBJECTS.map(s => (
                <button key={s.id} onClick={() => { setSubject(s.id); setTopic(''); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '8px 12px', borderRadius: 12, border: '1px solid',
                    borderColor: subject === s.id ? s.color : 'rgba(255,255,255,0.07)',
                    background: subject === s.id ? s.color + '15' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                  }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: subject === s.id ? s.color : '#6b7280' }}>{s.label}</span>
                </button>
              ))}
            </div>

            {/* Topic chips */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Topic (Optional)</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setTopic('')}
                  style={{ padding: '4px 10px', borderRadius: 99, border: '1px solid', fontSize: 10,
                    borderColor: !topic ? '#6366f1' : 'rgba(255,255,255,0.07)', background: !topic ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: !topic ? '#818cf8' : '#475569', cursor: 'pointer' }}>All</button>
                {(TOPICS[subject] || []).map(t => (
                  <button key={t} onClick={() => setTopic(t)}
                    style={{ padding: '4px 10px', borderRadius: 99, border: '1px solid', fontSize: 10,
                      borderColor: topic === t ? subj.color : 'rgba(255,255,255,0.07)',
                      background: topic === t ? subj.color + '20' : 'transparent',
                      color: topic === t ? subj.color : '#475569', cursor: 'pointer' }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  style={{ padding: '8px 6px', borderRadius: 10, border: '1px solid',
                    borderColor: mode === m.id ? '#6366f1' : 'rgba(255,255,255,0.07)',
                    background: mode === m.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 13 }}>{m.label}</div>
                  <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Generate button */}
            <button onClick={generate} disabled={loading}
              style={{
                width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: loading ? 'wait' : 'pointer',
                background: loading ? 'rgba(99,102,241,0.3)' : `linear-gradient(135deg, ${subj.color}cc, #6366f1)`,
                color: '#fff', fontSize: 14, fontWeight: 800, marginBottom: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {loading ? (
                <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Generating...</>
              ) : `Generate ${MODES.find(m => m.id === mode)?.label || mode} — ${subj.label}`}
            </button>

            {/* Result */}
            {result && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 700 }}>{subj.icon} {subj.label} — {MODES.find(m=>m.id===mode)?.label}</span>
                  <button onClick={() => { try { navigator.clipboard.writeText(result); } catch {} }}
                    style={{ fontSize: 10, color: '#475569', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>Copy</button>
                </div>
                <pre style={{ fontSize: 13, color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>{result}</pre>
              </div>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </>
        ) : (
          /* Scores tab */
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', marginBottom: 12 }}>📊 Recent Practice Scores</div>
            {scores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#374151', fontSize: 13 }}>
                Koi score nahi abhi — MCQ practice karo!
              </div>
            ) : (
              scores.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{s.subject}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{s.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: s.correct / s.total >= 0.6 ? '#22c55e' : '#f87171' }}>{s.correct}/{s.total}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{Math.round(s.correct / s.total * 100)}%</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
