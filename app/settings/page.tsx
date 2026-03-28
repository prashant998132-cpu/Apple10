'use client';
import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────
interface Profile { name: string; location: string; goal: string; age: string; customInstructions: string; language: string; responseLength: string; temperature: number; }
interface ApiKeys { groq: string; gemini: string; anthropic: string; openrouter: string; together: string; elevenlabs: string; cricapi: string; brave: string; }
interface Memory { facts: Array<{ key: string; value: string; ts: number }>; }
interface Reminder { id: string; text: string; time: string; repeat: string; active: boolean; }

const TABS = [
  { id: 'profile', label: 'Profile', emoji: '👤' },
  { id: 'apikeys', label: 'API Keys', emoji: '🔑' },
  { id: 'memory', label: 'Memory', emoji: '🧠' },
  { id: 'alerts', label: 'Alerts', emoji: '⏰' },
  { id: 'ai', label: 'AI', emoji: '⚡' },
  { id: 'about', label: 'About', emoji: 'ℹ️' },
];

const S = {
  page: { minHeight: '100vh', background: '#070810', color: '#e2e8f0', fontFamily: '-apple-system,sans-serif' } as const,
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#0a0c14', borderBottom: '1px solid rgba(255,255,255,0.07)' } as const,
  backBtn: { background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, color: '#e2e8f0', padding: '7px 12px', cursor: 'pointer', fontSize: 14 } as const,
  title: { fontSize: 16, fontWeight: 800, color: '#22d3ee', letterSpacing: '-0.3px' } as const,
  tabBar: { display: 'flex', overflowX: 'auto' as const, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0a0c14', padding: '0 8px' },
  tab: (active: boolean) => ({ padding: '11px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: active ? '#22d3ee' : '#374151', borderBottom: active ? '2px solid #22d3ee' : '2px solid transparent', whiteSpace: 'nowrap' as const, transition: 'all 0.15s' }),
  content: { padding: '16px', maxWidth: 500, margin: '0 auto' } as const,
  card: { background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px', marginBottom: 12 } as const,
  label: { fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6, display: 'block' },
  input: { width: '100%', background: '#070810', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const },
  btn: (color = '#6366f1') => ({ background: color, border: 'none', borderRadius: 10, color: '#fff', padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%', marginTop: 8 }),
  sectionTitle: { fontSize: 12, fontWeight: 800, color: '#22d3ee', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 },
  toast: { position: 'fixed' as const, bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#22c55e', color: '#fff', padding: '8px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700, zIndex: 9999 },
};

function load<T>(key: string, def: T): T {
  if (typeof window === 'undefined') return def;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function save(key: string, val: any) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');
  const [toast, setToast] = useState('');
  const [profile, setProfile] = useState<Profile>({ name: 'Prashant', location: 'Nadan, Maihar, MP', goal: 'NEET', age: '22', customInstructions: '', language: 'hinglish', responseLength: 'balanced', temperature: 0.7 });
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ groq: '', gemini: '', anthropic: '', openrouter: '', together: '', elevenlabs: '', cricapi: '', brave: '' });
  const [memory, setMemory] = useState<Memory>({ facts: [] });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newReminder, setNewReminder] = useState({ text: '', time: '', repeat: 'once' });

  useEffect(() => {
    setProfile(load('jarvis_profile', profile));
    setApiKeys(load('jarvis_api_keys', apiKeys));
    setMemory(load('jarvis_context_memory', { facts: [] }));
    setReminders(load('jarvis_reminders_list', []));
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const saveProfile = () => { save('jarvis_profile', profile); showToast('✅ Profile saved!'); };
  const saveKey = (key: keyof ApiKeys) => {
    const updated = { ...apiKeys };
    save('jarvis_api_keys', updated);
    // Also save to individual keys for backwards compat
    save(`jarvis_key_${key}`, apiKeys[key]);
    showToast(`✅ ${key} saved!`);
  };

  const testKey = async (key: keyof ApiKeys) => {
    const k = apiKeys[key];
    if (!k) { showToast('❌ Key empty'); return; }
    showToast('🔄 Testing...');
    try {
      if (key === 'groq') {
        const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${k}` } });
        showToast(r.ok ? '✅ Groq works!' : '❌ Groq invalid');
      } else if (key === 'gemini') {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${k}`);
        showToast(r.ok ? '✅ Gemini works!' : '❌ Gemini invalid');
      } else {
        showToast('ℹ️ Test not available');
      }
    } catch { showToast('❌ Network error'); }
  };

  const deleteMemory = (idx: number) => {
    const updated = { ...memory, facts: memory.facts.filter((_, i) => i !== idx) };
    setMemory(updated); save('jarvis_context_memory', updated);
    showToast('🗑️ Memory deleted');
  };

  const addReminder = () => {
    if (!newReminder.text || !newReminder.time) { showToast('❌ Text aur time chahiye'); return; }
    const r: Reminder = { id: Date.now().toString(), ...newReminder, active: true };
    const updated = [...reminders, r];
    setReminders(updated); save('jarvis_reminders_list', updated);
    setNewReminder({ text: '', time: '', repeat: 'once' });
    showToast('✅ Reminder added!');
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated); save('jarvis_reminders_list', updated);
    showToast('🗑️ Reminder deleted');
  };

  const API_KEY_CONFIG = [
    { key: 'groq' as const, label: 'Groq', badge: 'REQUIRED', badgeColor: '#f59e0b', desc: 'FREE 14,400/day. Flash mode. Fastest.', url: 'https://console.groq.com' },
    { key: 'gemini' as const, label: 'Gemini 2.0', badge: 'REQUIRED', badgeColor: '#f59e0b', desc: 'FREE 1500/day. Deep mode + tools.', url: 'https://aistudio.google.com' },
    { key: 'anthropic' as const, label: 'Claude (Anthropic)', badge: '🤖 POWERFUL', badgeColor: '#a78bfa', desc: 'Claude Haiku — Smart responses. console.anthropic.com', url: 'https://console.anthropic.com' },
    { key: 'openrouter' as const, label: 'OpenRouter', badge: '', badgeColor: '', desc: 'Think mode (DeepSeek R1). Free models.', url: 'https://openrouter.ai' },
    { key: 'together' as const, label: 'Together AI', badge: '', badgeColor: '', desc: '$25 free credit. 70B model fallback.', url: 'https://api.together.ai' },
    { key: 'elevenlabs' as const, label: 'ElevenLabs', badge: '', badgeColor: '', desc: '10K chars/month free. Best TTS.', url: 'https://elevenlabs.io' },
    { key: 'cricapi' as const, label: 'CricAPI', badge: '', badgeColor: '', desc: '100K/hour FREE. Live cricket scores.', url: 'https://cricapi.com' },
    { key: 'brave' as const, label: 'Brave Search', badge: '', badgeColor: '', desc: '2000 searches/month free.', url: 'https://api.search.brave.com' },
  ];

  return (
    <div style={S.page}>
      {toast && <div style={S.toast}>{toast}</div>}

      {/* Header */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => history.back()}>←</button>
        <span style={{ fontSize: 18 }}>⚙️</span>
        <span style={S.title}>SETTINGS</span>
      </div>

      {/* Tab Bar */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={S.content}>

        {/* ── PROFILE ── */}
        {tab === 'profile' && (
          <>
            <div style={S.card}>
              <div style={S.sectionTitle}>👤 Profile Info</div>
              <p style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>Yeh info JARVIS ko personality deta hai — teri baaton mein context aata hai.</p>
              {[
                { field: 'name', label: '👤 Naam', placeholder: 'Prashant' },
                { field: 'location', label: '📍 Location', placeholder: 'Maihar, MP' },
                { field: 'goal', label: '🎯 Goal / Kaam', placeholder: 'NEET, Engineering...' },
                { field: 'age', label: '🎂 Age', placeholder: '22' },
              ].map(({ field, label, placeholder }) => (
                <div key={field} style={{ marginBottom: 10 }}>
                  <label style={S.label}>{label}</label>
                  <input style={S.input} placeholder={placeholder}
                    value={(profile as any)[field]}
                    onChange={e => setProfile(p => ({ ...p, [field]: e.target.value }))} />
                </div>
              ))}
              <button style={S.btn('linear-gradient(135deg,#22d3ee,#6366f1)')} onClick={saveProfile}>Save Profile</button>
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>🎨 Theme</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['Dark', '#0a0b0f'], ['OLED', '#000000'], ['Nord', '#2e3440']].map(([name, bg]) => (
                  <button key={name} onClick={() => { document.body.style.background = bg; showToast(`${name} theme!`); }}
                    style={{ flex: 1, padding: '8px 0', background: bg, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── API KEYS ── */}
        {tab === 'apikeys' && (
          <>
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: 11, color: '#86efac' }}>
              🔒 Keys sirf tumhare phone pe store hain. Koi server pe nahi jaata.
            </div>
            {API_KEY_CONFIG.map(({ key, label, badge, badgeColor, desc, url }) => (
              <div key={key} style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0' }}>{label}</span>
                    {badge && <span style={{ fontSize: 9, background: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}55`, borderRadius: 99, padding: '2px 7px', fontWeight: 700 }}>{badge}</span>}
                    {apiKeys[key] && <span style={{ fontSize: 10, color: '#22c55e' }}>✓</span>}
                  </div>
                  <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none' }}>Get →</a>
                </div>
                <p style={{ fontSize: 10, color: '#374151', marginBottom: 8 }}>{desc}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input style={{ ...S.input, flex: 1 }}
                    type={showKeys[key] ? 'text' : 'password'}
                    placeholder={`${key.slice(0,3)}-...`}
                    value={apiKeys[key]}
                    onChange={e => setApiKeys(k => ({ ...k, [key]: e.target.value }))} />
                  <button onClick={() => setShowKeys(s => ({ ...s, [key]: !s[key] }))}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, color: '#6b7280', cursor: 'pointer', padding: '0 10px', fontSize: 14 }}>
                    {showKeys[key] ? '🙈' : '👁️'}
                  </button>
                  <button onClick={() => testKey(key)}
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 7, color: '#818cf8', cursor: 'pointer', padding: '0 10px', fontSize: 11, fontWeight: 700 }}>
                    Test
                  </button>
                  <button onClick={() => saveKey(key)}
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 7, color: '#86efac', cursor: 'pointer', padding: '0 10px', fontSize: 11, fontWeight: 700 }}>
                    Save
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── MEMORY ── */}
        {tab === 'memory' && (
          <div style={S.card}>
            <div style={S.sectionTitle}>🧠 JARVIS ne seekha ({memory.facts?.length || 0} memories)</div>
            {(!memory.facts || memory.facts.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#374151' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
                <div style={{ fontSize: 13 }}>Abhi kuch nahi seekha.</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Chat karo — JARVIS khud yaad rakhega.</div>
              </div>
            ) : (
              memory.facts.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee' }}>{f.key}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{f.value}</div>
                  </div>
                  <button onClick={() => deleteMemory(i)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 14, padding: '4px 8px' }}>🗑️</button>
                </div>
              ))
            )}
            {memory.facts && memory.facts.length > 0 && (
              <button style={{ ...S.btn('rgba(239,68,68,0.15)'), color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', marginTop: 12 }}
                onClick={() => { setMemory({ facts: [] }); save('jarvis_context_memory', { facts: [] }); showToast('🗑️ Memory cleared'); }}>
                Clear All Memory
              </button>
            )}
          </div>
        )}

        {/* ── ALERTS ── */}
        {tab === 'alerts' && (
          <>
            <div style={S.card}>
              <div style={S.sectionTitle}>➕ New Reminder</div>
              <p style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>Yahan tumhare saare reminders hain — edit, delete, manage karo.</p>
              <label style={S.label}>📝 Kya yaad dilana hai</label>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder='e.g. Paani peena'
                value={newReminder.text} onChange={e => setNewReminder(r => ({ ...r, text: e.target.value }))} />
              <label style={S.label}>⏰ Time</label>
              <input style={{ ...S.input, marginBottom: 8 }} type="time"
                value={newReminder.time} onChange={e => setNewReminder(r => ({ ...r, time: e.target.value }))} />
              <label style={S.label}>🔁 Repeat</label>
              <select style={{ ...S.input, marginBottom: 8 }}
                value={newReminder.repeat} onChange={e => setNewReminder(r => ({ ...r, repeat: e.target.value }))}>
                <option value="once">Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <button style={S.btn('linear-gradient(135deg,#22d3ee,#6366f1)')} onClick={addReminder}>+ Add Reminder</button>
            </div>

            {reminders.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '30px 14px', color: '#374151' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⏰</div>
                <div style={{ fontSize: 13 }}>Koi active reminder nahi.</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Chat mein bolo: "Kal 8 baje yaad dilao"</div>
              </div>
            ) : (
              reminders.map(r => (
                <div key={r.id} style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 3 }}>{r.text}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>⏰ {r.time} · 🔁 {r.repeat}</div>
                    </div>
                    <button onClick={() => deleteReminder(r.id)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>🗑️</button>
                  </div>
                </div>
              ))
            )}

            <div style={{ ...S.card, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div style={{ fontSize: 11, color: '#fde68a', lineHeight: 1.7 }}>
                💡 <strong>Recurring reminder set karne ke liye:</strong><br/>
                Chat mein bolo: "Har din 7 baje yaad dilao paani peena" → automatically daily reminder set ho jaayega.
              </div>
            </div>
          </>
        )}

        {/* ── AI SETTINGS ── */}
        {tab === 'ai' && (
          <>
            <div style={S.card}>
              <div style={S.sectionTitle}>📝 Custom Instructions (ChatGPT-style)</div>
              <p style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>Yeh hamesha JARVIS ke saath hoga — apne baare mein batao, kaise jawab chahiye.</p>
              <textarea style={{ ...S.input, minHeight: 100, resize: 'vertical' as const, marginBottom: 6 }}
                placeholder="E.g.: Main ek NEET student hoon. Simple Hinglish mein samjhao. Short answers do. Examples dena..."
                value={profile.customInstructions}
                onChange={e => setProfile(p => ({ ...p, customInstructions: e.target.value }))} />
              <div style={{ fontSize: 10, color: '#374151' }}>{profile.customInstructions.length}/1000 characters</div>
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>🌡️ Creativity / Temperature</div>
              <input type="range" min="0" max="1" step="0.1" value={profile.temperature}
                onChange={e => setProfile(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: '#22d3ee', marginBottom: 6 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#374151' }}>
                <span>Precise & Factual</span>
                <span style={{ color: '#22d3ee', fontWeight: 700 }}>{profile.temperature}</span>
                <span>Creative & Playful</span>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>🌐 Response Language</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['hinglish', '🇮🇳 Hinglish'], ['hindi', '🕉️ Hindi only'], ['english', '🔤 English']].map(([val, label]) => (
                  <button key={val} onClick={() => setProfile(p => ({ ...p, language: val }))}
                    style={{ flex: 1, padding: '9px 0', background: profile.language === val ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${profile.language === val ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, color: profile.language === val ? '#22d3ee' : '#6b7280', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>📏 Response Length</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['brief', '✂️ Brief'], ['balanced', '⚖️ Balanced'], ['detailed', '📖 Detailed']].map(([val, label]) => (
                  <button key={val} onClick={() => setProfile(p => ({ ...p, responseLength: val }))}
                    style={{ flex: 1, padding: '9px 0', background: profile.responseLength === val ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${profile.responseLength === val ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, color: profile.responseLength === val ? '#22d3ee' : '#6b7280', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button style={S.btn('linear-gradient(135deg,#22d3ee,#6366f1)')} onClick={saveProfile}>Save AI Settings</button>
          </>
        )}

        {/* ── ABOUT ── */}
        {tab === 'about' && (
          <>
            <div style={{ ...S.card, textAlign: 'center', padding: '24px 14px' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🤖</div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 3, color: '#e2e8f0', marginBottom: 4 }}>JARVIS v32</div>
              <div style={{ fontSize: 12, color: '#475569' }}>"Jons Bhai" — Your proactive AI companion</div>
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>📊 System Dashboard</div>
              {[
                ['🤖 AI Providers', '10 (Groq→Gemini→Together→DeepSeek→Pollinations)'],
                ['🎨 Image Gen', 'FLUX/Realism/Anime/3D + HuggingFace'],
                ['🌤️ Weather', 'Open-Meteo→WeatherAPI→met.no→wttr.in'],
                ['📰 News', 'NewsData→GNews→Google RSS→BBC Hindi'],
                ['🔍 Search', 'Brave→DuckDuckGo→Wikipedia'],
                ['🎙️ TTS', 'ElevenLabs→HuggingFace→Google TTS'],
                ['💻 Code Runner', 'Glot.io→Wandbox→Judge0 (15+ langs)'],
                ['🏏 Cricket', 'CricAPI→ESPN RSS'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11 }}>
                  <span style={{ color: '#6b7280' }}>{k}</span>
                  <span style={{ color: '#94a3b8', textAlign: 'right', maxWidth: '55%', fontSize: 10 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>📤 Export</div>
              <button style={{ ...S.btn('rgba(99,102,241,0.15)'), color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', marginBottom: 0 }}
                onClick={() => {
                  const data = { profile: load('jarvis_profile', {}), memories: load('jarvis_context_memory', {}), reminders: load('jarvis_reminders_list', []) };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'jarvis-backup.json'; a.click();
                  showToast('📥 Backup downloaded!');
                }}>
                📥 Backup Download (JSON)
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: 11, color: '#1f2937', padding: '12px 0' }}>
              JARVIS · ₹0 Forever 🔒 · Made with ❤️ by Prashant
            </div>
          </>
        )}
      </div>
    </div>
  );
}
