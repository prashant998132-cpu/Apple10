'use client';
import { useState, useEffect } from 'react';

interface Props {
  name: string;
  onSend: (text: string) => void;
}

const NEET_DATE = new Date('2026-05-03T00:00:00+05:30');

function getNEETDays() {
  return Math.max(0, Math.ceil((NEET_DATE.getTime() - Date.now()) / 86400000));
}

function getSmartSuggestions() {
  const h = new Date().getHours();
  const day = new Date().getDay(); // 0=Sun
  const isWeekend = day === 0 || day === 6;

  if (h < 6) return [
    { icon: '🌙', text: 'Raat ko neend nahi aa rahi — kya karna chahiye?' },
    { icon: '⭐', text: 'Koi interesting fact batao' },
    { icon: '📖', text: 'Ek short motivational story sunao' },
    { icon: '🧠', text: 'Mind relax karne ke tips do' },
  ];
  if (h < 10) return [
    { icon: '🌅', text: 'Aaj ka weather aur plan kya hona chahiye?' },
    { icon: '📰', text: 'Aaj ki top news kya hai?' },
    { icon: '🎯', text: 'Aaj ke liye productivity plan banao' },
    { icon: '💪', text: 'Subah ki motivation do bhai' },
  ];
  if (h < 13) return [
    { icon: '📚', text: isWeekend ? 'Weekend study plan banao NEET ke liye' : 'Aaj kya padhna chahiye?' },
    { icon: '⚛️', text: 'Physics ka ek important formula samjhao' },
    { icon: '🧪', text: 'Chemistry MCQ practice karwa do' },
    { icon: '💡', text: 'Study tips aur tricks batao' },
  ];
  if (h < 16) return [
    { icon: '☕', text: 'Dopahar ke bad energy kaise badhayein?' },
    { icon: '🔬', text: 'Biology ka ek concept explain karo' },
    { icon: '💰', text: 'Bitcoin aur gold ka aaj ka rate batao' },
    { icon: '🎯', text: 'Pomodoro technique se kaise padhen?' },
  ];
  if (h < 20) return [
    { icon: '🌆', text: 'Aaj ka revision plan banao' },
    { icon: '📝', text: 'Mock test ke baad kya karna chahiye?' },
    { icon: '🏃', text: 'Evening exercise routine suggest karo' },
    { icon: '🍎', text: 'Healthy dinner ideas do' },
  ];
  return [
    { icon: '🌙', text: 'Raat ko padhne ke best tips?' },
    { icon: '⭐', text: 'Aaj kya naya seekha? Recap karo' },
    { icon: '😴', text: 'Neend achi aane ke liye kya karein?' },
    { icon: '🎧', text: 'Study music recommendations' },
  ];
}

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
  const [weather, setWeather] = useState<{ temp: number; icon: string; desc: string } | null>(null);
  const [crypto, setCrypto] = useState<{ btc: number; eth: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [neetDays] = useState(getNEETDays());
  const greet = getGreet();
  const suggestions = getSmartSuggestions();

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('jarvis-db-profile') || '{}');
      setStreak(profile?.streak || 0);
      setXp(profile?.xp || 0);
    } catch {}

    // Weather
    (() => {
      try {
        const loc = JSON.parse(localStorage.getItem('jarvis_location') || '{}');
        const lat = loc.lat || 24.53;
        const lon = loc.lon || 81.3;
        return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,weathercode&timezone=auto');
      } catch {
        return fetch('https://api.open-meteo.com/v1/forecast?latitude=24.53&longitude=81.3&current=temperature_2m,weathercode&timezone=Asia/Kolkata');
      }
    })()
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

    // Crypto mini ticker
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=inr', { signal: AbortSignal.timeout(6000) })
      .then(r => r.json())
      .then(d => setCrypto({ btc: d.bitcoin?.inr, eth: d.ethereum?.inr }))
      .catch(() => {});
  }, []);

  const level = Math.floor(xp / 100) + 1;
  const xpProgress = xp % 100;

  const cityName = typeof window !== 'undefined' ? (() => {
    try {
      const l = JSON.parse(localStorage.getItem('jarvis_location') || '{}');
      const p = JSON.parse(localStorage.getItem('jarvis_profile') || '{}');
      return l.city || p.location?.split(',')[0] || 'Aapka Shehar';
    } catch { return 'Aapka Shehar'; }
  })() : 'Aapka Shehar';

  return (
    <div style={{ padding: '0 14px 80px', maxWidth: 480, margin: '0 auto' }}>

      {/* Greeting */}
      <div style={{ textAlign: 'center', padding: '20px 0 14px' }}>
        <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginBottom: 3, letterSpacing: '0.04em' }}>
          {greet.text} {greet.emoji}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
          {name} 👋
        </div>
      </div>

      {/* Time + Weather */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#60a5fa', lineHeight: 1.1 }}>{time}</div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{formatDate()}</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => onSend('Aaj ka weather forecast aur tips do')}>
          {weather ? (
            <>
              <div style={{ fontSize: 28 }}>{weather.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9' }}>{weather.temp}°C</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{cityName}</div>
              </div>
            </>
          ) : <div style={{ fontSize: 11, color: '#374151' }}>☁️ Loading...</div>}
        </div>
      </div>

      {/* NEET Countdown */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(99,102,241,0.08))',
        border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14,
        padding: '11px 16px', marginBottom: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer',
      }} onClick={() => onSend('NEET 2026 ke liye aaj ka study plan banao')}>
        <div>
          <div style={{ fontSize: 11, color: '#f87171', fontWeight: 800, marginBottom: 2 }}>🎯 NEET 2026 Countdown</div>
          <div style={{ fontSize: 10, color: '#475569' }}>Aaj ka study plan banao →</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#f87171', lineHeight: 1 }}>{neetDays}</div>
          <div style={{ fontSize: 9, color: '#6b7280' }}>days left</div>
        </div>
      </div>

      {/* XP + Streak + Crypto */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 12, padding: '9px 12px' }}>
          <div style={{ fontSize: 9, color: '#fbbf24', fontWeight: 600, marginBottom: 3 }}>⚡ Lv.{level}</div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginBottom: 3 }}>
            <div style={{ height: '100%', width: xpProgress + '%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 9, color: '#475569' }}>{xp} XP</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 18 }}>🔥</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#22c55e' }}>{streak}</div>
            <div style={{ fontSize: 9, color: '#475569' }}>streak</div>
          </div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 12, padding: '9px 10px', cursor: 'pointer' }}
          onClick={() => onSend('Bitcoin aur crypto prices live batao')}>
          <div style={{ fontSize: 9, color: '#fbbf24', fontWeight: 600, marginBottom: 3 }}>₿ BTC</div>
          <div style={{ fontSize: crypto ? 11 : 9, fontWeight: 900, color: '#fbbf24', lineHeight: 1.2 }}>
            {crypto ? '₹' + (crypto.btc / 100000).toFixed(0) + 'L' : '...'}
          </div>
          <div style={{ fontSize: 8, color: '#475569' }}>tap for all</div>
        </div>
      </div>

      {/* Smart suggestions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {suggestions.map((s, i) => (
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
