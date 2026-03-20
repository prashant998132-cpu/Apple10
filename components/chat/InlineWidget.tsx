'use client';
import { useState, useEffect } from 'react';

interface Props { data: any; type: string; }

function WeatherCard({ data }: { data: any }) {
  const wc = data?.current;
  const codes: Record<number, [string, string]> = {
    0:['☀️','Clear'], 1:['🌤️','Mostly Clear'], 2:['⛅','Partly Cloudy'],
    3:['☁️','Overcast'], 45:['🌫️','Foggy'], 61:['🌧️','Rain'],
    71:['❄️','Snow'], 80:['🌦️','Showers'], 95:['⛈️','Storm'],
  };
  const [icon, desc] = codes[wc?.weathercode] || ['🌡️', 'Weather'];
  return (
    <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#0f2040)', borderRadius: 12, padding: '12px 14px', marginTop: 8 }}>
      <div style={{ fontSize: 10, color: '#60a5fa', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>📍 Maihar, MP</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 38 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{Math.round(wc?.temperature_2m ?? 0)}°C</div>
          <div style={{ fontSize: 11, color: '#93c5fd' }}>{desc}</div>
        </div>
      </div>
    </div>
  );
}

function FinanceCard({ data }: { data: any }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <div style={{ background: '#0d1117', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 14px', marginTop: 8 }}>
      <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>💹 Live Prices</div>
      {items.map((item: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{item.name || item.symbol}</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#e2e8f0' }}>₹{Number(item.price || item.inr || 0).toLocaleString('en-IN')}</div>
        </div>
      ))}
    </div>
  );
}

function NewsCard({ data }: { data: any }) {
  const articles = (Array.isArray(data) ? data : []).slice(0, 4);
  return (
    <div style={{ background: '#0d0f18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginTop: 8 }}>
      <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>📰 News</div>
      {articles.map((a: any, i: number) => (
        <div key={i} style={{ padding: '6px 0', borderBottom: i < articles.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer' }}
          onClick={() => a.url && window.open(a.url, '_blank')}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, marginBottom: 2 }}>{a.title}</div>
          <div style={{ fontSize: 10, color: '#475569' }}>{a.source}</div>
        </div>
      ))}
    </div>
  );
}

function CalcCard() {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('');
  const calc = () => { try { setResult(String(Function('"use strict";return (' + expr + ')')())); } catch { setResult('Error'); } };
  const btns = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'];
  const press = (b: string) => {
    if (b === '=') { calc(); return; }
    if (b === '÷') { setExpr(e => e + '/'); return; }
    if (b === '×') { setExpr(e => e + '*'); return; }
    setExpr(e => e + b);
  };
  return (
    <div style={{ background: '#0d0f18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginTop: 8, maxWidth: 220 }}>
      <div style={{ fontSize: 10, color: '#818cf8', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>🔢 Calculator</div>
      <div style={{ background: '#070810', borderRadius: 8, padding: '8px 10px', marginBottom: 8, minHeight: 44 }}>
        <div style={{ fontSize: 11, color: '#475569' }}>{expr || '0'}</div>
        {result && <div style={{ fontSize: 20, fontWeight: 900, color: '#86efac' }}>{result}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
        {btns.map(b => (
          <button key={b} onClick={() => press(b)}
            style={{ padding: '9px 0', background: b === '=' ? '#6366f1' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, color: '#e2e8f0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {b}
          </button>
        ))}
        <button onClick={() => { setExpr(''); setResult(''); }}
          style={{ gridColumn: 'span 4', padding: '7px 0', background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: 7, color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          Clear
        </button>
      </div>
    </div>
  );
}

function TimerCard({ data }: { data: any }) {
  const [sec, setSec] = useState(data?.seconds || 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSec((s: number) => {
      if (s <= 1) { setRunning(false); setDone(true); clearInterval(id); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [running]);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return (
    <div style={{ background: '#0d0f18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 14, marginTop: 8, textAlign: 'center', maxWidth: 180 }}>
      <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 8 }}>⏱️ TIMER</div>
      <div style={{ fontSize: 38, fontWeight: 900, color: done ? '#22c55e' : '#e2e8f0', fontFamily: 'monospace', marginBottom: 10 }}>{fmt(sec)}</div>
      {done && <div style={{ fontSize: 18, marginBottom: 6 }}>🔔 Done!</div>}
      <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>
        <button onClick={() => { setRunning(r => !r); setDone(false); }}
          style={{ padding: '7px 14px', background: running ? '#dc2626' : '#6366f1', border: 'none', borderRadius: 7, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={() => { setSec(data?.seconds || 60); setRunning(false); setDone(false); }}
          style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 7, color: '#e2e8f0', cursor: 'pointer', fontSize: 12 }}>
          Reset
        </button>
      </div>
    </div>
  );
}

function QRCard({ data }: { data: any }) {
  const text = data?.text || '';
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginTop: 8, display: 'inline-block', textAlign: 'center' }}>
      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(text)}`}
        alt="QR" style={{ width: 140, height: 140, borderRadius: 6 }} />
      <div style={{ fontSize: 10, color: '#1e293b', marginTop: 6, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</div>
    </div>
  );
}

function DictCard({ data }: { data: any }) {
  return (
    <div style={{ background: '#0d0f18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginTop: 8, maxWidth: 300 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#e2e8f0', marginBottom: 3 }}>{data?.word}</div>
      {data?.phonetic && <div style={{ fontSize: 11, color: '#818cf8', marginBottom: 8 }}>{data.phonetic}</div>}
      {(data?.meanings || []).slice(0, 2).map((m: any, i: number) => (
        <div key={i} style={{ marginBottom: 7 }}>
          <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 3 }}>{m.partOfSpeech}</div>
          {m.definitions?.slice(0, 2).map((d: any, j: number) => (
            <div key={j} style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, marginBottom: 3 }}>{j + 1}. {d.definition}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function InlineWidget({ type, data }: Props) {
  if (!data) return null;
  switch (type) {
    case 'weather':    return <WeatherCard data={data} />;
    case 'finance':    return <FinanceCard data={data} />;
    case 'news':       return <NewsCard data={data} />;
    case 'calculator': return <CalcCard />;
    case 'timer':      return <TimerCard data={data} />;
    case 'qr':         return <QRCard data={data} />;
    case 'dict':       return <DictCard data={data} />;
    default: return null;
  }
}
