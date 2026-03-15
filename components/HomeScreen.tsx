'use client';
import { useState, useEffect } from 'react';

interface Props {
  name: string;
  onSend: (text: string) => void;
}

const SUGGESTIONS = [
  { icon: '🌤️', text: 'Aaj ka mausam kaisa hai?' },
  { icon: '📚', text: 'Mujhe study plan bana do' },
  { icon: '🖼️', text: 'Ek realistic jungle image banao' },
  { icon: '🚆', text: 'Delhi train kab hai?' },
  { icon: '🧠', text: 'Ek concept simple mein samjhao' },
  { icon: '🎯', text: 'Mera weekly goal set karo' },
];

function getGreet() {
  const h = new Date().getHours();
  if (h < 5)  return { text: 'Raat ki Salaam', emoji: '🌙' };
  if (h < 12) return { text: 'Subah ki Salaam', emoji: '🌅' };
  if (h < 17) return { text: 'Dopahar ki Salaam', emoji: '☀️' };
  if (h < 21) return { text: 'Shaam ki Salaam', emoji: '🌆' };
  return { text: 'Raat ki Salaam', emoji: '🌙' };
}

function formatTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function formatDate() {
  return new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function HomeScreen({ name, onSend }: Props) {
  const [time, setTime] = useState(formatTime());
  const [weather, setWeather] = useState<{ temp: number; icon: string } | null>(null);
  const [festival, setFestival] = useState('');
  const greet = getGreet();

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(id);
  }, []);

  // Weather
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=24.53&longitude=81.3&current=temperature_2m,weathercode&timezone=Asia/Kolkata')
      .then(r => r.json())
      .then(d => {
        const c = d.current;
        const wc = c.weathercode;
        const icon = wc === 0 ? '☀️' : wc <= 3 ? '⛅' : wc <= 48 ? '🌫️' : wc <= 67 ? '🌧️' : wc <= 77 ? '❄️' : wc <= 82 ? '🌦️' : '⛈️';
        setWeather({ temp: Math.round(c.temperature_2m), icon });
      }).catch(() => {});
  }, []);

  // Festival check
  useEffect(() => {
    const today = new Date();
    const m = today.getMonth() + 1, d = today.getDate();
    const festivals: Record<string, string> = {
      '1-26': '🇮🇳 Aaj Republic Day hai — Jai Hind!',
      '3-8': '🌸 Aaj Holi hai — Rang barse!',
      '8-15': '🇮🇳 Aaj Independence Day hai — Jai Hind!',
      '10-2': '🙏 Aaj Gandhi Jayanti hai',
      '11-14': '🧒 Aaj Bal Diwas hai',
      '12-25': '🎄 Aaj Christmas hai — Merry Christmas!',
    };
    setFestival(festivals[`${m}-${d}`] || '');
  }, []);

  return (
    <div style={{ padding: '0 16px 20px', maxWidth: 480, margin: '0 auto' }}>

      {/* ── Greeting ── */}
      <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
        <div style={{ fontSize: 13, color: '#60a5fa', fontWeight: 600, marginBottom: 4, letterSpacing: '0.02em' }}>
          {greet.text} {greet.emoji}
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
          {name} 👋
        </div>
      </div>

      {/* ── Time + Weather cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {/* Time */}
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#60a5fa', lineHeight: 1.1 }}>{time}</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 5 }}>{formatDate()}</div>
        </div>
        {/* Weather */}
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {weather ? (
            <>
              <div style={{ fontSize: 30 }}>{weather.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9' }}>{weather.temp}°</div>
                <div style={{ fontSize: 10, color: '#475569' }}>Maihar, MP</div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#374151' }}>☁️ Loading...</div>
          )}
        </div>
      </div>

      {/* ── Festival banner ── */}
      {festival && (
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 14, padding: '10px 14px', marginBottom: 14, textAlign: 'center', fontSize: 13, color: '#fde68a', fontWeight: 600 }}>
          {festival}
        </div>
      )}

      {/* ── Suggestion grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => onSend(s.text)}
            style={{
              background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '12px 12px', textAlign: 'left', cursor: 'pointer',
              transition: 'all 0.15s', color: '#e2e8f0',
            }}
            onTouchStart={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
            onTouchEnd={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.8)')}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{s.text}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
