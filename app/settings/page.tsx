'use client';
import { useState, useEffect } from 'react';
import { APP_DEFS, getAppKeys, saveAppKey, getEnabledApps, setAppEnabled, getAppStatus, AppId } from '@/lib/connectedApps';

type Cat = 'all' | 'ai' | 'media' | 'info' | 'productivity';

export default function SettingsPage() {
  const [cat,     setCat]     = useState<Cat>('all');
  const [keys,    setKeys]    = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState<AppId[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [keyVal,  setKeyVal]  = useState('');
  const [saved,   setSaved]   = useState<string | null>(null);

  useEffect(() => {
    setKeys(getAppKeys());
    setEnabled(getEnabledApps());
  }, []);

  const toggleApp = (id: AppId) => {
    const on = !enabled.includes(id);
    setAppEnabled(id, on);
    setEnabled(getEnabledApps());
  };

  const saveKey = (id: AppId) => {
    saveAppKey(id, keyVal.trim());
    const on = keyVal.trim().length > 0;
    setAppEnabled(id, on);
    setKeys(getAppKeys());
    setEnabled(getEnabledApps());
    setEditing(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  };

  const filtered = cat === 'all' ? APP_DEFS : APP_DEFS.filter(a => a.category === cat);
  const readyCount = APP_DEFS.filter(a => getAppStatus(a) === 'ready').length;

  const CATS: [Cat, string, string][] = [
    ['all', '🌐', 'All'],
    ['ai', '🤖', 'AI'],
    ['media', '🎨', 'Media'],
    ['info', 'ℹ️', 'Info'],
    ['productivity', '🛠️', 'Tools'],
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#070810', padding: '16px 16px 40px', fontFamily: '-apple-system,sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>⚙️ Settings</h1>
        <div style={{ fontSize: 12, color: '#4b5563' }}>
          {readyCount}/{APP_DEFS.length} apps ready · JARVIS auto-routes based on your message
        </div>
      </div>

      {/* Status banner */}
      <div style={{
        background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: 12, padding: '10px 14px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#86efac' }}>Auto-routing active</div>
          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>
            "image banao" → 🎨 Image Gen · "weather" → 🌤️ Open-Meteo · "nasa" → 🚀 NASA APOD
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
        {CATS.map(([id, icon, label]) => (
          <button key={id} onClick={() => setCat(id)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: cat === id ? '#3b82f6' : 'rgba(255,255,255,0.05)',
            color: cat === id ? '#fff' : '#6b7280',
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* App cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(app => {
          const status = getAppStatus(app);
          const isOn   = enabled.includes(app.id);
          const isEdit = editing === app.id;

          return (
            <div key={app.id} style={{
              background: isOn ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
              border: `1px solid ${status === 'ready' ? 'rgba(34,197,94,0.2)' : isOn ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 14, padding: '12px 14px',
              transition: 'all 0.15s',
            }}>
              {/* App row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22, minWidth: 30, textAlign: 'center' }}>{app.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{app.name}</span>
                    {app.freeForever && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: '#22c55e',
                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                        borderRadius: 6, padding: '1px 5px',
                      }}>FREE</span>
                    )}
                    {status === 'ready' && (
                      <span style={{
                        fontSize: 9, color: '#60a5fa',
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: 6, padding: '1px 5px', fontWeight: 700,
                      }}>READY</span>
                    )}
                    {saved === app.id && (
                      <span style={{ fontSize: 10, color: '#22c55e' }}>✓ Saved!</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{app.desc}</div>
                  {/* Trigger keywords */}
                  {app.triggers.length > 0 && (
                    <div style={{ fontSize: 10, color: '#374151', marginTop: 4 }}>
                      {app.triggers.slice(0, 4).map(t => (
                        <span key={t} style={{
                          background: 'rgba(255,255,255,0.04)', borderRadius: 4,
                          padding: '1px 5px', marginRight: 4, fontSize: 10, color: '#6b7280',
                        }}>"{t}"</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toggle */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => toggleApp(app.id)} style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: isOn ? '#22c55e' : 'rgba(255,255,255,0.08)',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 3, left: isOn ? 21 : 3,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#fff', transition: 'left 0.2s',
                    }} />
                  </button>
                  {app.keyRequired && !app.freeForever && (
                    <button onClick={() => { setEditing(isEdit ? null : app.id); setKeyVal(keys[app.id] || ''); }}
                      style={{
                        fontSize: 10, color: status === 'needs_key' ? '#f59e0b' : '#6b7280',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      }}>
                      {status === 'needs_key' ? '⚠️ Key?' : '🔑 Edit'}
                    </button>
                  )}
                </div>
              </div>

              {/* Key input */}
              {isEdit && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <input
                    type="password"
                    value={keyVal}
                    onChange={e => setKeyVal(e.target.value)}
                    placeholder={app.keyPlaceholder || 'API Key...'}
                    onKeyDown={e => e.key === 'Enter' && saveKey(app.id)}
                    style={{
                      flex: 1, background: '#0a0d16', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, padding: '8px 12px', color: '#e2e8f0',
                      fontSize: 13, outline: 'none', fontFamily: 'monospace',
                    }}
                    autoFocus
                  />
                  <button onClick={() => saveKey(app.id)} style={{
                    padding: '8px 14px', background: '#3b82f6', border: 'none',
                    borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>Save</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom info */}
      <div style={{ marginTop: 24, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>
          🔒 Keys browser mein encrypted local storage mein save hote hain. Server pe nahi jaate.<br/>
          ⚡ Free apps (IMAGE, WEATHER, ARXIV, GITHUB, LIBRARY) koi bhi key ke bina kaam karte hain.<br/>
          🤖 JARVIS automatically sahi app choose karta hai tumhare message ke hisaab se.
        </div>
      </div>
    </div>
  );
}
