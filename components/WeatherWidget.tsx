'use client';
import { useState, useEffect } from 'react';

interface WData {
  city: string;
  current: { temp: number; feels_like: number; humidity: number; wind: number; icon: string; desc: string; code: number; };
  forecast: Array<{ date: string; max: number; min: number; rain: number; uv: number; icon: string; desc: string; }>;
}

export default function WeatherWidget({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<WData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loc  = JSON.parse(localStorage.getItem('jarvis_location') || '{}');
    const prof = JSON.parse(localStorage.getItem('jarvis_profile') || '{}');
    const lat  = loc.lat  || 24.5362;
    const lon  = loc.lon  || 81.3003;
    const city = encodeURIComponent(loc.city || prof.location?.split(',')[0] || 'Maihar');
    fetch(`/api/weather?lat=${lat}&lon=${lon}&city=${city}&days=5`)
      .then(r => r.json()).then(d => { if (d.current) setData(d); else setError(d.error || 'Data nahi mili'); })
      .catch(() => setError('Weather load fail')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '12px 16px', background: 'rgba(15,23,42,0.9)', borderRadius: 14, color: '#374151', fontSize: 12 }}>☁️ Mausam load ho raha hai...</div>;
  if (!data || error) return <div style={{ padding: '12px 16px', background: 'rgba(15,23,42,0.9)', borderRadius: 14, color: '#f87171', fontSize: 12 }}>⚠️ {error || 'Unavailable'}</div>;

  const c = data.current;
  const tip = c.code >= 51 ? '☂️ Chhata le jaana!' : c.temp > 38 ? '🥵 Paani piyo!' : c.temp < 15 ? '🧥 Jacket pehno!' : '';

  if (compact) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'linear-gradient(135deg,rgba(30,58,95,0.9),rgba(15,32,64,0.9))', borderRadius: 12, border: '1px solid rgba(96,165,250,0.2)' }}>
      <span style={{ fontSize: 24 }}>{c.icon}</span>
      <div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{c.temp}°C</div>
        <div style={{ fontSize: 10, color: '#93c5fd' }}>{data.city} · {c.desc}</div>
      </div>
      {tip && <div style={{ marginLeft: 'auto', fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>{tip}</div>}
    </div>
  );

  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(15,23,50,0.95),rgba(10,15,35,0.95))', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 16, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>📍 {data.city}</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{c.temp}°<span style={{ fontSize: 20 }}>C</span></div>
          <div style={{ fontSize: 13, color: '#93c5fd', marginTop: 4 }}>{c.icon} {c.desc}</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Feels {c.feels_like}° · 💧{c.humidity}% · 💨{c.wind}km/h</div>
          {tip && <div style={{ marginTop: 6, fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>{tip}</div>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
        {data.forecast.slice(0, 5).map((f, i) => {
          const day = i === 0 ? 'Aaj' : new Date(f.date).toLocaleDateString('hi-IN', { weekday: 'short' });
          return (
            <div key={f.date} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
              <div style={{ fontSize: 9, color: '#64748b', marginBottom: 4, fontWeight: 700 }}>{day}</div>
              <div style={{ fontSize: 16 }}>{f.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9' }}>{f.max}°</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>{f.min}°</div>
              {f.rain > 0 && <div style={{ fontSize: 8, color: '#60a5fa' }}>💧{f.rain}mm</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
