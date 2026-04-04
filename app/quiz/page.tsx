'use client';
import { useState } from 'react';

interface Question { q: string; opts: string[]; ans: string; explanation: string; }

const TOPICS = [
  { label: '🧪 Chemistry', value: 'Chemistry for NEET' },
  { label: '⚛️ Physics', value: 'Physics for NEET' },
  { label: '🧬 Biology', value: 'Biology for NEET' },
  { label: '📐 Math', value: 'Mathematics' },
  { label: '🌍 GK', value: 'General Knowledge India' },
  { label: '💻 Coding', value: 'Programming concepts' },
  { label: '📚 Custom', value: '' },
];

export default function QuizPage() {
  const [topic, setTopic] = useState(TOPICS[0].value);
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finalTopic = topic || customTopic;

  async function startQuiz() {
    if (!finalTopic) { setError('Topic daalo!'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: finalTopic, difficulty, count }),
      });
      const d = await r.json();
      if (d.questions?.length) {
        setQuestions(d.questions);
        setCurrent(0); setScore(0); setSelected(null); setDone(false);
      } else { setError(d.error || 'Questions generate nahi hue'); }
    } catch { setError('Network error'); }
    setLoading(false);
  }

  function selectAnswer(opt: string) {
    if (selected) return;
    setSelected(opt);
    if (opt === questions[current].ans) setScore(s => s + 1);
  }

  function next() {
    if (current + 1 >= questions.length) { setDone(true); return; }
    setCurrent(c => c + 1); setSelected(null);
  }

  const S = {
    page: { minHeight: '100vh', background: '#070810', color: '#e2e8f0', padding: '16px 14px 80px' },
    card: { background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px', marginBottom: 12 },
    btn: (active: boolean, color = '#6366f1') => ({
      padding: '8px 14px', border: '1px solid', borderRadius: 10,
      borderColor: active ? color : 'rgba(255,255,255,0.08)',
      background: active ? color + '22' : 'rgba(255,255,255,0.03)',
      color: active ? color : '#6b7280', fontSize: 12, fontWeight: 700, cursor: 'pointer',
    }),
    optBtn: (opt: string) => {
      const isSelected = selected === opt;
      const isCorrect = selected && opt === questions[current]?.ans;
      const isWrong = selected === opt && opt !== questions[current]?.ans;
      return {
        width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid',
        borderColor: isCorrect ? '#22c55e' : isWrong ? '#ef4444' : isSelected ? '#6366f1' : 'rgba(255,255,255,0.08)',
        background: isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
        color: isCorrect ? '#4ade80' : isWrong ? '#f87171' : '#e2e8f0',
        fontSize: 13, textAlign: 'left' as const, cursor: selected ? 'default' : 'pointer', marginBottom: 8,
        fontWeight: isCorrect ? 700 : 400,
      };
    },
  };

  if (questions.length === 0) return (
    <div style={S.page}>
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: '#22d3ee' }}>🧠 AI Quiz</div>

      <div style={S.card}>
        <div style={{ fontSize: 10, color: '#4b5563', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>Topic Choose Karo</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {TOPICS.map(t => (
            <button key={t.value} onClick={() => setTopic(t.value)} style={S.btn(topic === t.value)}>{t.label}</button>
          ))}
        </div>
        {topic === '' && (
          <input value={customTopic} onChange={e => setCustomTopic(e.target.value)}
            placeholder="Apna topic type karo..."
            style={{ width: '100%', background: '#070810', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 13px', color: '#e2e8f0', fontSize: 13, outline: 'none' }} />
        )}
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 10, color: '#4b5563', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>Difficulty</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['easy','medium','hard'] as const).map(d => (
            <button key={d} onClick={() => setDifficulty(d)} style={S.btn(difficulty === d, d === 'easy' ? '#22c55e' : d === 'hard' ? '#ef4444' : '#6366f1')}>
              {d === 'easy' ? '😊 Easy' : d === 'medium' ? '🎯 Medium' : '🔥 Hard'}
            </button>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 10, color: '#4b5563', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>Questions: {count}</div>
        <input type="range" min={3} max={15} value={count} onChange={e => setCount(+e.target.value)} style={{ width: '100%', accentColor: '#6366f1' }} />
      </div>

      {error && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}>⚠️ {error}</div>}

      <button onClick={startQuiz} disabled={loading}
        style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#6366f1,#0891b2)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
        {loading ? '⏳ Generating...' : '🚀 Quiz Shuru Karo'}
      </button>
    </div>
  );

  if (done) return (
    <div style={{ ...S.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>{score >= questions.length * 0.8 ? '🏆' : score >= questions.length * 0.5 ? '👍' : '📚'}</div>
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>{score}/{questions.length} Sahi!</div>
      <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
        {score === questions.length ? 'Perfect score! Zabardast! 🎉' : score >= questions.length * 0.8 ? 'Bahut acha! 💪' : score >= questions.length * 0.5 ? 'Theek hai, aur practice karo! 📖' : 'Phir koshish karo! 🔁'}
      </div>
      <button onClick={() => setQuestions([])} style={{ padding: '12px 32px', background: '#6366f1', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
        🔄 Naya Quiz
      </button>
    </div>
  );

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>Q {current + 1}/{questions.length}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#22c55e' }}>✅ {score}</div>
      </div>

      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: progress + '%', background: 'linear-gradient(90deg,#6366f1,#22d3ee)', borderRadius: 99, transition: 'width 0.3s' }} />
      </div>

      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>{q.q}</div>
      </div>

      {q.opts.map(opt => (
        <button key={opt} onClick={() => selectAnswer(opt)} style={S.optBtn(opt)}>
          {opt}
        </button>
      ))}

      {selected && (
        <div style={{ ...S.card, borderColor: selected === q.ans ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)', marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>💡 {q.explanation}</div>
        </div>
      )}

      {selected && (
        <button onClick={next} style={{ width: '100%', marginTop: 12, padding: 14, background: '#6366f1', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
          {current + 1 >= questions.length ? '📊 Result Dekho' : 'Agla Sawaal →'}
        </button>
      )}
    </div>
  );
}
