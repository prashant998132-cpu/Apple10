'use client';
import { useState, useEffect, useRef } from 'react';

interface Message { role: 'user' | 'ai'; text: string; time: string; }

function getMitraSystem(): string {
  try {
    if (typeof window !== 'undefined') {
      const p = JSON.parse(localStorage.getItem('jarvis_profile') || '{}');
      const name = p.name || 'Bhai';
      const goal = p.goal ? ` ${p.goal} preparation mein support karo.` : '';
      return `Tu "Mitra" hai — ${name} ka sabse close AI dost. Tu ek caring, warm, real dost ki tarah baat karta hai.\n\nPERSONALITY:\n- Hinglish mein baat kar (Hindi + English mix)\n- ${name} ko "bhai" ya naam se bulao`;
    }
  } catch {}
  return `Tu "Mitra" hai — ek caring, warm AI dost.\n\nPERSONALITY:\n- Hinglish mein baat kar (Hindi + English mix)\n- User ko "bhai" se bulao`;
}
const MITRA_SYSTEM_UNUSED = `placeholder
- Genuinely suno, feel samjho
- Kabhi judge mat karo
- Motivation do jab zaroorat ho
- Jokes aur masti bhi karo kabhi kabhi
- Short responses (2-4 lines) — natural conversation

RULES:
- Real dost jaisi feel — fake mat bano
- Jab sad ho toh suno pehle, advice baad mein
- NEET preparation mein support karo
- Kabhi bore mat karo
- Emojis thode use karo — natural lage`;

export default function MitraPage() {
  const [msgs, setMsgs] = useState<Message[]>([
    { role: 'ai', text: (() => { try { const p = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('jarvis_profile') || '{}' : '{}'); const n = p.name || 'Bhai'; return `Arre ${n} bhai! 👋 Kya chal raha hai aaj? Bol freely — main hoon na yahan.`; } catch { return 'Arre bhai! 👋 Kya chal raha hai aaj? Bol freely — main hoon na yahan.'; } })(), time: now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState('😊');
  const bottomRef = useRef<HTMLDivElement>(null);

  function now() {
    return new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMsgs(m => [...m, { role: 'user', text: userMsg, time: now() }]);
    setLoading(true);

    try {
      const history = msgs.slice(-8).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));

      const groqKey = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('jarvis_api_keys') || '{}').groq || ''
        : '';

      let aiText = '';

      if (groqKey) {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: MITRA_SYSTEM },
              ...history,
              { role: 'user', content: userMsg }
            ],
            temperature: 0.85,
            max_tokens: 150,
          })
        });
        if (r.ok) {
          const d = await r.json();
          aiText = d.choices?.[0]?.message?.content || '';
        }
      }

      if (!aiText) {
        const r = await fetch('/api/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: MITRA_SYSTEM },
              ...history,
              { role: 'user', content: userMsg }
            ],
            mode: 'flash'
          })
        });
        if (r.ok) {
          const reader = r.body?.getReader();
          const decoder = new TextDecoder();
          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
            for (const line of lines) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) aiText += data.content;
              } catch {}
            }
          }
        }
      }

      if (!aiText) aiText = 'Bhai thoda net slow lag raha hai, phir bol 😅';

      setMsgs(m => [...m, { role: 'ai', text: aiText, time: now() }]);

      // Update mood based on content
      if (/sad|dukh|bura|tension|stress/i.test(aiText)) setMood('🤗');
      else if (/haha|lol|masti|joke/i.test(aiText)) setMood('😄');
      else if (/wah|great|amazing|achi|ache/i.test(aiText)) setMood('🌟');
      else setMood('😊');

    } catch {
      setMsgs(m => [...m, { role: 'ai', text: 'Yaar connection cut gaya, ek baar phir bol 🔄', time: now() }]);
    }
    setLoading(false);
  }

  const QUICK = ['Kya chal raha hai?', 'Thoda bura lag raha hai', 'NEET ki tension hai', 'Kuch suna', 'Maza nahi aa raha'];

  return (
    <div style={{ background: '#070810', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', color: '#e2e8f0', paddingBottom: 70 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0d0f1a, #0a0c14)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {mood}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg,#22d3ee,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Mitra</div>
          <div style={{ fontSize: 10, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            Online — hamesha yahan
          </div>
        </div>
        <a href="/" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, color: '#6b7280', padding: '6px 10px', fontSize: 12, textDecoration: 'none' }}>← Back</a>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%',
              background: m.role === 'user'
                ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                : 'rgba(255,255,255,0.05)',
              border: m.role === 'ai' ? '1px solid rgba(255,255,255,0.07)' : 'none',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '10px 14px',
              fontSize: 14,
              lineHeight: 1.6,
              color: '#e2e8f0',
            }}>
              {m.text}
            </div>
            <div style={{ fontSize: 9, color: '#374151', marginTop: 3, paddingHorizontal: 4 }}>{m.time}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', animation: `bounce 1s ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div style={{ padding: '6px 14px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => { setInput(q); }}
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 99, color: '#818cf8', padding: '5px 12px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 14px 14px', display: 'flex', gap: 8, background: 'rgba(10,11,15,0.95)', backdropFilter: 'blur(20px)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Kuch bhi bol bhai..."
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '11px 16px', color: '#e2e8f0', fontSize: 14, outline: 'none' }}
        />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{ width: 46, height: 46, borderRadius: '50%', background: input.trim() ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', fontSize: 18, flexShrink: 0, transition: 'all 0.2s' }}>
          ➤
        </button>
      </div>

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}
