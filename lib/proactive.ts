'use client';

// ══════════════════════════════════════════════════════════════
// PROACTIVE ENGINE v2 — Real data + Dynamic name + Smart context
// ══════════════════════════════════════════════════════════════

function getProfile() {
  try { return JSON.parse(localStorage.getItem('jarvis_profile') || '{}'); } catch { return {}; }
}
function getLocation() {
  try { return JSON.parse(localStorage.getItem('jarvis_location') || '{}'); } catch { return {}; }
}
function getName(): string {
  return getProfile().name || 'Bhai';
}

// Real weather fetch using saved location
async function fetchWeatherMsg(): Promise<string> {
  try {
    const loc = getLocation();
    const lat = loc.lat || 24.53;
    const lon = loc.lon || 81.3;
    const city = loc.city || getProfile().location?.split(',')[0] || 'Aapke shehar';
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,relative_humidity_2m,windspeed_10m&timezone=auto`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return '';
    const d = await r.json();
    const c = d.current;
    const wc = (code: number) =>
      code <= 1 ? '☀️ Saaf asmaan' :
      code <= 3 ? '⛅ Thode badal' :
      code <= 48 ? '🌫️ Kohra' :
      code <= 67 ? '🌧️ Baarish ho rahi hai' :
      code <= 77 ? '❄️ Barf' :
      '⛈️ Toofan aa raha hai';
    const weather = wc(c.weathercode);
    const temp = Math.round(c.temperature_2m);
    // Smart suggestion based on weather
    const suggestion =
      c.weathercode >= 51 ? '☂️ Chhata le jana!' :
      temp > 38 ? '🥵 Bahut garmi hai — paani piते raho!' :
      temp < 12 ? '🧥 Thandi hai — kapde pehno!' :
      '😊 Mausam theek hai aaj!';
    return `**${city} mein abhi:** ${temp}°C — ${weather}\n${suggestion}`;
  } catch { return ''; }
}

// Real news fetch
async function fetchTopNews(): Promise<string> {
  try {
    // Use free GNews RSS
    const r = await fetch('https://gnews.io/api/v4/top-headlines?country=in&lang=hi&max=2&apikey=free', {
      signal: AbortSignal.timeout(4000)
    });
    // If gnews fails, try RSS via fetch proxy
    if (!r.ok) throw new Error('gnews failed');
    const d = await r.json();
    if (d.articles?.length) {
      return '📰 **Aaj ki khabar:**\n' + d.articles.slice(0, 2).map((a: any) => `• ${a.title}`).join('\n');
    }
    return '';
  } catch {
    // Fallback - just skip news
    return '';
  }
}

// ── Main proactive engine ──────────────────────────────────────
export function startProactiveEngine(onMessage: (msg: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const run = async () => {
    const hour = new Date().getHours();
    const min  = new Date().getMinutes();
    const key  = `proactive_${new Date().toDateString()}`;
    const done: string[] = JSON.parse(localStorage.getItem(key) || '[]');

    const trigger = (id: string, msg: string) => {
      if (done.includes(id)) return;
      onMessage(msg);
      done.push(id);
      localStorage.setItem(key, JSON.stringify(done));
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    };

    const name = getName();

    // ── Morning brief (8 AM) ─────────────────────────────────
    if (hour === 8 && min < 10) {
      try {
        const weatherMsg = await fetchWeatherMsg();
        const routine = JSON.parse(localStorage.getItem('jarvis_routine_v2') || '[]');
        const todayStr = new Date().toISOString().slice(0, 10);
        const pending = routine.filter((r: any) => !r.doneDate || r.doneDate !== todayStr);
        const routineStr = pending.length > 0
          ? `\n\n📋 **Aaj ki routine:**\n${pending.slice(0, 3).map((r: any) => `• ${r.time} — ${r.emoji} ${r.label}`).join('\n')}`
          : '';
        const weatherStr = weatherMsg ? `\n\n🌤️ ${weatherMsg}` : '';
        trigger('morning', `🌅 **Good Morning ${name}!**${weatherStr}${routineStr}\n\nAaj ka din ekdum mast jayega! 💪`);
      } catch {
        trigger('morning', `🌅 **Good Morning ${name}!** Aaj ka din badhiya rahega! 💪`);
      }
    }

    // ── Mid-morning weather nudge (10 AM) ────────────────────
    if (hour === 10 && min < 10) {
      try {
        const loc = getLocation();
        const lat = loc.lat || 24.53;
        const lon = loc.lon || 81.3;
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weathercode,temperature_2m&timezone=auto`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (r.ok) {
          const d = await r.json();
          const code = d.current.weathercode;
          const temp = Math.round(d.current.temperature_2m);
          if (code >= 51) trigger('rain_warn', `🌧️ **${name}, baarish aa sakti hai aaj!** Bahar jaana ho toh chhata le jaana. (${temp}°C)`);
          else if (temp > 38) trigger('heat_warn', `🥵 **${name}, aaj bahut garmi hai!** ${temp}°C — paani peete raho, avoid dhoop 12-4 PM.`);
        }
      } catch {}
    }

    // ── Lunch reminder (1 PM) ────────────────────────────────
    if (hour === 13 && min < 10) {
      const prof = getProfile();
      const goals = prof.goal ? ` | Goal: ${prof.goal}` : '';
      trigger('lunch', `🍽️ **Lunch time ${name}!** Kha lo — aur 2 glass paani bhi piyo 💧${goals ? '\n💡 Energy chahiye goals ke liye!' : ''}`);
    }

    // ── Eye care reminder (every 2 hrs, 8AM-8PM) ────────────
    if (min < 5 && hour % 2 === 0 && hour >= 8 && hour <= 20) {
      trigger(`eye_${hour}`, `👁️ **20-20-20 Rule!** Screen se break lo ${name} — 20 seconds ke liye 20 feet door dekho. Aankhen theek rahegi! 👀`);
    }

    // ── Evening review (8 PM) ────────────────────────────────
    if (hour === 20 && min < 10) {
      try {
        const prof = JSON.parse(localStorage.getItem('jarvis-db-profile') || '{}');
        const streak = prof.streak || 0;
        const xp = prof.xp || 0;
        const streakMsg = streak > 0 ? `\n🔥 Streak: ${streak} days | XP: ${xp}` : '';
        trigger('evening', `🌙 **Shaam ho gayi ${name}!** Aaj ka din kaisa raha?${streakMsg}\n\n📝 Goals tab mein progress update karo!`);
      } catch {
        trigger('evening', `🌙 **Shaam ho gayi ${name}!** Goals tab mein progress update karo! 🎯`);
      }
    }

    // ── Late night warning ───────────────────────────────────
    if (hour >= 0 && hour < 4 && min < 10) {
      trigger('midnight', `🦉 **Raat ke ${hour} baj gaye ${name}!** So jao — neend se hi brain recharge hota hai 😴\nKal fresh mind se karo!`);
    }

    // ── Battery check ────────────────────────────────────────
    if ('getBattery' in navigator) {
      try {
        const bat: any = await (navigator as any).getBattery();
        if (bat.level < 0.2 && !bat.charging) {
          trigger(`batt_${Math.round(bat.level * 10)}`, `🔋 **Battery ${Math.round(bat.level * 100)}% ${name}!** Charger lagao warna JARVIS band ho jayega!`);
        }
        bat.addEventListener('levelchange', () => {
          if (bat.level < 0.10 && !bat.charging) {
            onMessage(`⚡ **CRITICAL! Battery sirf ${Math.round(bat.level * 100)}%!** Abhi charger lagao ${name}!`);
          }
        });
      } catch {}
    }

    // ── Streak celebration ───────────────────────────────────
    try {
      const prof = JSON.parse(localStorage.getItem('jarvis-db-profile') || '{}');
      const streak = prof.streak || 0;
      if (streak >= 7 && hour === 9 && min < 10) {
        trigger('streak', `🔥 **${streak} day streak ${name}!** Consistency is the key — keep going! 🗝️`);
      }
      if (streak >= 30 && hour === 9 && min < 10) {
        trigger('streak30', `🏆 **30 DIN KI STREAK ${name}!** Yeh toh legendary hai bhai! 🎉`);
      }
    } catch {}

    // ── Smart context: if user hasn't chatted today ──────────
    if (hour === 11 && min < 10) {
      try {
        const lastChat = localStorage.getItem('jarvis_last_chat_date');
        const today = new Date().toDateString();
        if (lastChat !== today) {
          trigger('nudge_chat', `💬 **${name}, aaj kuch kaam karaana hai?** Main ready hoon — weather, news, gold rate, ya koi bhi cheez poocho! ⚡`);
        }
      } catch {}
    }
  };

  run();
  const iv = setInterval(run, 5 * 60 * 1000); // Check every 5 min

  // Register routine alarms
  try {
    const routine = JSON.parse(localStorage.getItem('jarvis_routine_v2') || '[]');
    routine.filter((r: any) => r.alarm).forEach((r: any) => {
      const [h, m] = r.time.split(':').map(Number);
      const now   = new Date();
      const alarm = new Date();
      alarm.setHours(h, m, 0, 0);
      if (alarm <= now) alarm.setDate(alarm.getDate() + 1);
      const ms = alarm.getTime() - now.getTime();
      setTimeout(() => {
        const name = getName();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`⏰ ${r.emoji} ${r.label}`, {
            body: `${r.time} — Time ho gaya ${name}!`,
            icon: '/icons/icon-192.png',
          });
        }
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
        onMessage(`⏰ **${r.emoji} ${r.label} — ${r.time}**\nTime ho gaya ${name}! 💪`);
      }, ms);
    });
  } catch {}

  return () => clearInterval(iv);
}

// ── Proactive suggestion for welcome screen ────────────────────
export function getProactiveSuggestion(): string | null {
  try {
    const hour = new Date().getHours();
    const name = getName();
    const loc  = getLocation();
    const city = loc.city || getProfile().location?.split(',')[0] || '';

    if (hour >= 8 && hour <= 9) {
      return `☀️ Subah ki shuruat! ${city ? `${city} mein ` : ''}aaj ka mausam dekhna ho toh poocho ${name}!`;
    }
    if (hour >= 13 && hour <= 14) return `🍽️ Lunch ke baad thoda energy low hota hai — kuch poocho ya plan banao!`;
    if (hour >= 21 && hour <= 23) return `🌙 Din khatam hone wala hai — aaj ke goals review karein ${name}?`;
    return null;
  } catch { return null; }
}

// ── TTS speak helper ───────────────────────────────────────────
export function speakText(text: string, lang = 'hi-IN') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[#*`>\[\]()]/g, '').replace(/\n/g, '. ').slice(0, 300);
  const utt = new SpeechSynthesisUtterance(clean);
  utt.lang = lang; utt.rate = 0.95; utt.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const hiVoice = voices.find(v => v.lang.includes('hi')) || voices.find(v => v.lang.includes('en-IN'));
  if (hiVoice) utt.voice = hiVoice;
  window.speechSynthesis.speak(utt);
}
