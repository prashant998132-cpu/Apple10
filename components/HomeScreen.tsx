'use client';
import { useState, useEffect } from 'react';

interface Props {
  name: string;
  onSend: (text: string) => void;
}

const SUGGESTIONS = [
  { icon: '🌤️', text: 'Aaj ka mausam kaisa hai Maihar mein?' },
  { icon: '📚', text: 'Physics ke Newton laws explain karo' },
  { icon: '🧬', text: 'NEET Biology top 10 topics batao' },
  { icon: '⚗️', text: 'Chemistry ke organic reactions summarize karo' },
  { icon: '🧠', text: 'Ek concept simple mein samjhao' },
  { icon: '🎯', text: 'Aaj ka study plan bana do NEET ke liye' },
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

// NEET 2026 countdown — typically 1st Sunday of May
function getNEETCountdown() {
  const neet = new Date('2026-05-03T00:00:00+05:30'); // NEET 2026 approx date
  const now = new Date();
  const diff = neet.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days;
}

export default function HomeScreen({ name, onSend }: Props) {
  const [time, setTime] = useState(formatTime());
  const [weather, setWeather] = useState<{ temp: number; icon: string; desc: string } | null>(null);
  const [neetDays, setNeetDays] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const greet = getGreet();

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setNeetDays(getNEETCountdown());
    // Load streak + XP from localStorage
    try {
      const profile = JSON.parse(localStorage.getItem('jarvis-db-profile') || '{}');
      setStreak(profile?.streak || 0);
      setXp(profile?.xp || 0);
    } catch {}
    // Weather — Maihar coords
    fetch('https://api.open-meteo.com/v1/forecast?latitude=24.53&longitude=81.3&current=temperature_2m,weathercode&timezone=Asia/Kolkata')
      .then(r => r.json())
      .then(d => {
        const c = d.current;
        const wc = c.weathercode;
        const WMO: Record<number, [string, string]> = {
          0: ['☀️', 'Clear'], 1: ['🌤️', 'Mostly clear'], 2: ['⛅', 'Partly cloudy'],
          3: ['☁️', 'Overcast'], 45: ['🌫️', 'Foggy'], 48: ['🌫️', 'Foggy'],
          51: ['🌦️', 'Drizzle'], 61: ['🌧️', 'Rain'], 63: ['🌧️', 'Heavy rain'],
          71: ['❄️', 'Snow'], 80: ['🌦️', 'Showers'], 95: ['⛈️', 'Thunderstorm'],
        };
        const [icon, desc] = WMO[wc] || ['🌡️', 'Unknown'];
        setWeather({ temp: Math.round(c.temperature_2m), icon, desc });
      }).catch(() => {});
  }, []);

  const level = Math.floor(xp / 100) + 1;
  const xpProgress = xp % 100;

  return (
    <div style={{ padding: '0 14px 80px', maxWidth: 480, margin: '0 auto' }}>

      {/* Greeting */}
      <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
        <div style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600, marginBottom: 3, letterSpacing: '0.03em' }}>
          {greet.text} {greet.emoji}
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
          {name} 👋
        </div>
      </div>

      {/* Time + Weather */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#60a5fa', lineHeight: 1.1 }}>{time}</div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{formatDate()}</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {weather ? (
            <>
              <div style={{ fontSize: 28 }}>{weather.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9' }}>{weather.temp}°C</div>
                <div style={{ fontSize: 10, color: '#475569' }}>Maihar, MP</div>
              </div>
            </>
          ) : <div style={{ fontSize: 11, color: '#374151' }}>☁️ Loading...</div>}
        </div>
      </div>

      {/* NEET Countdown */}
      {neetDays !== null && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(99,102,241,0.1))',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14,
          padding: '12px 16px', marginBottom: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#f87171', fontWeight: 700, marginBottom: 2 }}>🎯 NEET 2026 Countdown</div>
            <div style={{ fontSize: 10, color: '#475569' }}>Har din count karta hai bhai</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#f87171', lineHeight: 1 }}>{neetDays}</div>
            <div style={{ fontSize: 9, color: '#6b7280' }}>days left</div>
          </div>
        </div>
      )}

      {/* XP + Streak */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 14, padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>⚡ Level {level}</div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
            <div style={{ height: '100%', width: xpProgress + '%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: 99, transition: 'width 0.5s' }} />
          </div>
          <div style={{ fontSize: 10, color: '#475569' }}>{xp} XP total</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 24 }}>🔥</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#22c55e' }}>{streak}</div>
            <div style={{ fontSize: 10, color: '#475569' }}>day streak</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => onSend(s.text)}
            style={{
              background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '12px', textAlign: 'left', cursor: 'pointer',
              transition: 'all 0.15s', color: '#e2e8f0',
            }}
            onTouchStart={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
            onTouchEnd={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.8)')}
          >
            <div style={{ fontSize: 20, marginBottom: 5 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{s.text}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
