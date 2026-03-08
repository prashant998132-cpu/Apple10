'use client';
import React, { useState, useEffect } from 'react';
import { getProfile, saveProfile, getAllMemories, deleteMemory, ALL_BADGES } from '@/lib/memory';
import { getDB } from '@/lib/db';

// ── Storage status checker ────────────────────────────────────
async function checkStorageStatus() {
  const status = {
    local: { active: false, size: '0 KB', count: 0 },
    puter: { active: false, user: '' },
    supabase: { active: false },
    primary: 'local' as 'local' | 'puter' | 'supabase',
  };

  // 1. Local IndexedDB — always available
  try {
    const db = getDB();
    if (db) {
      const msgCount = await db.messages.count();
      const memCount = await db.memory.count();
      status.local.active = true;
      status.local.count = msgCount + memCount;
      // Estimate size from localStorage
      let lsSize = 0;
      for (const k of Object.keys(localStorage)) lsSize += (localStorage.getItem(k) || '').length;
      status.local.size = lsSize > 1024 * 1024 ? `${(lsSize / 1024 / 1024).toFixed(1)} MB` : `${Math.round(lsSize / 1024)} KB`;
    }
  } catch {}

  // 2. Puter
  try {
    const puter = (window as any).puter;
    if (puter && puter.auth) {
      const u = await puter.auth.getUser();
      if (u?.username) { status.puter.active = true; status.puter.user = u.username; }
    }
  } catch {}

  // 3. Supabase
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (sbUrl && sbKey && sbUrl.includes('supabase')) status.supabase.active = true;

  // Primary from localStorage
  const saved = localStorage.getItem('jarvis_primary_storage') as any;
  if (saved) status.primary = saved;
  else if (status.supabase.active) status.primary = 'supabase';
  else if (status.puter.active) status.primary = 'puter';
  else status.primary = 'local';

  return status;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [tab, setTab] = useState('storage');
  const [apiKeys, setApiKeys] = useState<any>({});
  const [saved, setSaved] = useState('');
  const [storageStatus, setStorageStatus] = useState<any>(null);
  const [primaryStorage, setPrimaryStorage] = useState('local');

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      setProfile(p);
      const m = await getAllMemories();
      setMemories(m);
      try { setApiKeys(JSON.parse(localStorage.getItem('jarvis_api_keys') || '{}')); } catch {}
      const st = await checkStorageStatus();
      setStorageStatus(st);
      setPrimaryStorage(st.primary);
    })();
  }, []);

  const saveKey = (k: string, v: string) => {
    const u = { ...apiKeys, [k]: v };
    setApiKeys(u);
    localStorage.setItem('jarvis_api_keys', JSON.stringify(u));
    setSaved('✅ Saved!'); setTimeout(() => setSaved(''), 2000);
  };

  const setPrimary = (s: string) => {
    setPrimaryStorage(s);
    localStorage.setItem('jarvis_primary_storage', s);
    setSaved(`✅ Primary: ${s}`); setTimeout(() => setSaved(''), 2000);
  };

  const nukeData = async () => {
    if (!confirm('⚠️ Sab kuch delete karna hai? Messages, memories, goals — sab!')) return;
    const db = getDB();
    if (db) { await db.messages.clear(); await db.memory.clear(); await db.goals.clear(); await db.profile.clear(); }
    localStorage.clear(); window.location.reload();
  };

  const TABS = [
    { id: 'storage', label: '💾 Storage' },
    { id: 'general', label: '⚙️ General' },
    { id: 'memory',  label: '🧠 Memory' },
    { id: 'keys',    label: '🔑 API Keys' },
    { id: 'about',   label: 'ℹ️ About' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0a0b0f]">
      <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-bold mb-4 text-white">⚙️ Settings</h1>

        {/* Tab bar */}
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-gray-800/80 text-gray-400 border border-gray-700/50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {saved && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs px-3 py-2 rounded-xl mb-4">{saved}</div>}

        {/* ════════════════════════════════════════════
            STORAGE TAB
        ════════════════════════════════════════════ */}
        {tab === 'storage' && (
          <div className="space-y-4">

            {/* Explanation */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-xs text-blue-300 font-semibold mb-1">Storage kaise kaam karta hai?</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                JARVIS 3 jagah data save karta hai. <strong className="text-gray-300">Local</strong> hamesha kaam karta hai — phone pe hi rahta hai.
                <strong className="text-gray-300"> Puter</strong> cloud backup deta hai (1GB free).
                <strong className="text-gray-300"> Supabase</strong> multi-device sync karta hai.
                Primary select karo — baaki fallback hoga.
              </p>
            </div>

            {/* Storage cards */}
            <div className="space-y-3">

              {/* LOCAL */}
              <div className={`rounded-xl border p-4 transition-all ${primaryStorage === 'local' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700/50 bg-gray-900/50'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="text-sm font-bold text-white">Local Storage</p>
                      <p className="text-xs text-gray-500">IndexedDB + localStorage</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">✅ Always ON</span>
                    {primaryStorage === 'local' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white">PRIMARY</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">{storageStatus?.local.count || 0}</p>
                    <p className="text-[10px] text-gray-500">Items</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">{storageStatus?.local.size || '...'}</p>
                    <p className="text-[10px] text-gray-500">Used</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">∞</p>
                    <p className="text-[10px] text-gray-500">Limit</p>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 mb-3 space-y-0.5">
                  <p>💬 Chat history — IndexedDB mein</p>
                  <p>🧠 Memories + XP — IndexedDB mein</p>
                  <p>🔑 API keys — localStorage mein (encrypted nahi)</p>
                  <p>⚠️ Phone format hone pe data jaata hai</p>
                </div>
                {primaryStorage !== 'local' && (
                  <button onClick={() => setPrimary('local')}
                    className="w-full py-2 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 hover:border-blue-500 transition-colors">
                    Set as Primary
                  </button>
                )}
              </div>

              {/* PUTER */}
              <div className={`rounded-xl border p-4 transition-all ${primaryStorage === 'puter' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700/50 bg-gray-900/50'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">☁️</span>
                    <div>
                      <p className="text-sm font-bold text-white">Puter Cloud</p>
                      <p className="text-xs text-gray-500">1GB free — photos, audio, docs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {storageStatus?.puter.active
                      ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">✅ Connected</span>
                      : <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">⭕ Not signed in</span>}
                    {primaryStorage === 'puter' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white">PRIMARY</span>}
                  </div>
                </div>
                {storageStatus?.puter.active && (
                  <p className="text-xs text-green-400 mb-2">👤 {storageStatus.puter.user}</p>
                )}
                <div className="text-[11px] text-gray-500 mb-3 space-y-0.5">
                  <p>🖼️ Media Vault photos — Puter FS mein</p>
                  <p>🎵 Audio recordings — Puter FS mein</p>
                  <p>🤖 GPT-4o mini + DALL-E 3 (free)</p>
                  <p>✅ Phone change hone pe bhi data safe</p>
                </div>
                <div className="flex gap-2">
                  {!storageStatus?.puter.active && (
                    <button onClick={() => (window as any).puter?.auth?.signIn?.()}
                      className="flex-1 py-2 rounded-lg text-xs font-medium bg-purple-600/80 text-white border border-purple-500/50">
                      Sign in to Puter
                    </button>
                  )}
                  {storageStatus?.puter.active && primaryStorage !== 'puter' && (
                    <button onClick={() => setPrimary('puter')}
                      className="flex-1 py-2 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 hover:border-blue-500 transition-colors">
                      Set as Primary
                    </button>
                  )}
                </div>
              </div>

              {/* SUPABASE */}
              <div className={`rounded-xl border p-4 transition-all ${primaryStorage === 'supabase' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700/50 bg-gray-900/50'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔄</span>
                    <div>
                      <p className="text-sm font-bold text-white">Supabase Sync</p>
                      <p className="text-xs text-gray-500">Multi-device sync — 500MB free</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {storageStatus?.supabase.active
                      ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">✅ Connected</span>
                      : <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">⭕ Not configured</span>}
                    {primaryStorage === 'supabase' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white">PRIMARY</span>}
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 mb-3 space-y-0.5">
                  <p>💬 Chat messages — cloud mein sync</p>
                  <p>🧠 Memories — dono devices pe</p>
                  <p>👤 Profile + XP — synced</p>
                  <p>⚙️ Setup: .env mein SUPABASE_URL + KEY add karo</p>
                </div>
                {!storageStatus?.supabase.active ? (
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500 font-mono">NEXT_PUBLIC_SUPABASE_URL=</p>
                    <p className="text-[10px] text-gray-500 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY=</p>
                    <p className="text-[10px] text-gray-600 mt-1">Vercel dashboard &gt; Environment Variables</p>
                  </div>
                ) : primaryStorage !== 'supabase' ? (
                  <button onClick={() => setPrimary('supabase')}
                    className="w-full py-2 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 hover:border-blue-500 transition-colors">
                    Set as Primary
                  </button>
                ) : null}
              </div>
            </div>

            {/* Storage flow diagram */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-400 mb-2">📊 Data Flow (abhi)</p>
              <div className="flex items-center gap-1 text-xs flex-wrap">
                <span className="bg-gray-800 px-2 py-1 rounded-lg text-gray-300">Chat Message</span>
                <span className="text-gray-600">→</span>
                <span className={`px-2 py-1 rounded-lg ${primaryStorage === 'local' ? 'bg-blue-600/30 text-blue-300' : 'bg-gray-800 text-gray-500'}`}>📱 Local</span>
                <span className="text-gray-600">+</span>
                <span className={`px-2 py-1 rounded-lg ${storageStatus?.supabase.active ? 'bg-green-600/30 text-green-300' : 'bg-gray-800 text-gray-600'}`}>🔄 Supabase</span>
              </div>
              <div className="flex items-center gap-1 text-xs flex-wrap mt-1">
                <span className="bg-gray-800 px-2 py-1 rounded-lg text-gray-300">Media Upload</span>
                <span className="text-gray-600">→</span>
                <span className={`px-2 py-1 rounded-lg ${storageStatus?.puter.active ? 'bg-purple-600/30 text-purple-300' : 'bg-gray-800 text-gray-600'}`}>☁️ Puter</span>
                <span className="text-gray-600">+</span>
                <span className="bg-gray-800 px-2 py-1 rounded-lg text-gray-500">📱 Thumbnail</span>
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-red-400 mb-2">⚠️ Danger Zone</p>
              <button onClick={nukeData}
                className="w-full py-2 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50 transition-colors">
                🗑️ Sab data delete karo (reset)
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            GENERAL TAB
        ════════════════════════════════════════════ */}
        {tab === 'general' && profile && (
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Profile</p>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Naam (Jons Bhai ka)</label>
                <input value={profile.name || ''} onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="Tera naam..." />
              </div>
              <button onClick={async () => { await saveProfile(profile); setSaved('✅ Saved!'); setTimeout(() => setSaved(''), 2000); }}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white">
                Save Profile
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                ['⚡ XP', profile.xp || 0],
                ['🔥 Streak', `${profile.streak || 0}d`],
                ['🏆 Level', profile.level || 1],
              ].map(([label, val]) => (
                <div key={String(label)} className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-white">{val}</p>
                  <p className="text-[10px] text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* PIN */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 mb-2">🔒 PIN Lock</p>
              <p className="text-xs text-gray-500 mb-2">App lock karne ke liye 4-digit PIN set karo</p>
              <button onClick={() => { localStorage.removeItem('jarvis_pin'); setSaved('✅ PIN cleared'); setTimeout(() => setSaved(''), 2000); }}
                className="text-xs text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg">Clear PIN</button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            MEMORY TAB
        ════════════════════════════════════════════ */}
        {tab === 'memory' && (
          <div className="space-y-3">
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-3">
              <p className="text-xs text-gray-500">{memories.length} memories stored locally</p>
            </div>
            {memories.length === 0 && <p className="text-xs text-gray-600 text-center py-8">Abhi koi memory nahi</p>}
            {memories.slice(0, 30).map(m => (
              <div key={m.id} className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-200 leading-relaxed truncate">{m.text}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{m.type} · importance {m.importance}</p>
                </div>
                <button onClick={async () => { await deleteMemory(m.id); setMemories(prev => prev.filter(x => x.id !== m.id)); }}
                  className="text-red-400/60 hover:text-red-400 text-xs flex-shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════
            API KEYS TAB
        ════════════════════════════════════════════ */}
        {tab === 'keys' && (
          <div className="space-y-3">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-xs text-yellow-400">⚠️ Keys phone pe localStorage mein store hote hain — Vercel env vars zyada safe hain</p>
            </div>
            {[
              { label: '⚡ Groq', key: 'GROQ_API_KEY', hint: 'groq.com — free 14k/day' },
              { label: '🧠 Gemini', key: 'GEMINI_API_KEY', hint: 'aistudio.google.com — free 1.5k/day' },
              { label: '🎵 Spotify', key: 'SPOTIFY_CLIENT_ID', hint: 'developer.spotify.com' },
              { label: '📺 YouTube', key: 'YOUTUBE_API_KEY', hint: 'Google Cloud Console' },
              { label: '📬 Telegram', key: 'TELEGRAM_BOT_TOKEN', hint: '@BotFather pe banao' },
              { label: '🎬 TMDB', key: 'TMDB_API_KEY', hint: 'themoviedb.org' },
              { label: '🌤️ News', key: 'GNEWS_API_KEY', hint: 'gnews.io — free 100/day' },
              { label: '🔊 ElevenLabs', key: 'ELEVENLABS_API_KEY', hint: '10k chars/month free' },
            ].map(({ label, key, hint }) => (
              <div key={key} className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-white">{label}</span>
                  <span className="text-[10px] text-gray-600">{hint}</span>
                </div>
                <input type="password" value={apiKeys[key] || ''}
                  onChange={e => saveKey(key, e.target.value)}
                  placeholder={`${key}=...`}
                  className="w-full bg-gray-800/80 border border-gray-700/50 rounded-lg px-3 py-1.5 text-xs text-gray-300 font-mono outline-none focus:border-blue-500" />
                {apiKeys[key] && <p className="text-[10px] text-green-400 mt-1">✅ Set</p>}
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════
            ABOUT TAB
        ════════════════════════════════════════════ */}
        {tab === 'about' && (
          <div className="space-y-3">
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-3xl mb-2">🤖</p>
              <p className="text-lg font-bold text-white">JARVIS v8</p>
              <p className="text-xs text-gray-500">Built for Jons Bhai — Rewa, MP 🇮🇳</p>
            </div>
            {[
              ['🤖 AI Models', '6-provider cascade — Groq → Gemini → Mistral → OpenRouter → Pollinations'],
              ['💾 Storage', '3-layer — Local IndexedDB + Puter Cloud + Supabase Sync'],
              ['🔧 Tools', '30+ autonomous tools — no credits wasted'],
              ['🎵 Music', 'Deezer (free) → Spotify → LastFM'],
              ['📺 Video', 'YouTube API + link fallback'],
              ['💬 Messaging', 'Telegram + Discord webhook'],
              ['📱 PWA', 'Installable, offline, haptics'],
            ].map(([k, v]) => (
              <div key={String(k)} className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-300">{k}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
