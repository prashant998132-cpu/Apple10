'use client';
import React, { useState } from 'react';

const MACROS = [
  { category: '🔋 Battery', macros: [
    { name: 'Battery Low Alert', trigger: 'Battery Level ≤ 20%', body: '{"type":"battery_low","value":"[bat]"}', icon: '🔋' },
    { name: 'Battery Critical', trigger: 'Battery Level ≤ 10%', body: '{"type":"battery_critical","value":"[bat]"}', icon: '🚨' },
    { name: 'Battery Full', trigger: 'Battery Level ≥ 100%', body: '{"type":"battery_full","value":"100"}', icon: '✅' },
    { name: 'Charging Started', trigger: 'Power Connected', body: '{"type":"charging_start","value":"[bat]"}', icon: '⚡' },
    { name: 'Charger Removed', trigger: 'Power Disconnected', body: '{"type":"charging_stop","value":"[bat]"}', icon: '🔌' },
  ]},
  { category: '📍 Location', macros: [
    { name: 'Reached Home', trigger: 'Location → Enter zone (ghar)', body: '{"type":"location_home","value":"Ghar"}', icon: '🏠' },
    { name: 'Left Home', trigger: 'Location → Exit zone (ghar)', body: '{"type":"location_left","value":"Ghar"}', icon: '🚶' },
    { name: 'Reached Work/College', trigger: 'Location → Enter zone (kaam)', body: '{"type":"location_arrived","value":"College"}', icon: '📍' },
  ]},
  { category: '📱 Calls & SMS', macros: [
    { name: 'Missed Call', trigger: 'Missed Call', body: '{"type":"missed_call","value":"[cnum]"}', icon: '📵' },
    { name: 'Call Ended', trigger: 'Call End', body: '{"type":"call_ended","value":"[callduration]"}', icon: '📞' },
  ]},
  { category: '📶 Connectivity', macros: [
    { name: 'WiFi Connected', trigger: 'WiFi Connected', body: '{"type":"wifi_connected","value":"[wifissid]"}', icon: '📶' },
    { name: 'WiFi Disconnected', trigger: 'WiFi Disconnected', body: '{"type":"wifi_disconnected","value":""}', icon: '📵' },
  ]},
  { category: '🎧 Media', macros: [
    { name: 'Headphones In', trigger: 'Headset → Plugged In', body: '{"type":"headphones_in","value":""}', icon: '🎧' },
  ]},
];

const CMD_EXAMPLES = [
  { say: '"torch on"', does: 'Flashlight on' },
  { say: '"wifi off"', does: 'WiFi settings' },
  { say: '"screenshot lo"', does: 'Screenshot' },
  { say: '"volume 50"', does: 'Volume 50%' },
  { say: '"lock karo phone"', does: 'Screen lock' },
  { say: '"YouTube kholo"', does: 'YouTube open' },
  { say: '"alarm 7 baje"', does: '7AM alarm' },
  { say: '"pause music"', does: 'Media pause' },
  { say: '"call 9876..."', does: 'Direct call' },
  { say: '"DND on"', does: 'Do Not Disturb' },
];

export default function MacroDroidPage() {
  const [copied, setCopied] = useState('');
  const copy = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt).catch(() => {});
    setCopied(id); setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#070810', color:'#e2e8f0', padding:'20px 16px', maxWidth:600, margin:'0 auto', paddingBottom:40 }}>
      <div style={{ marginBottom:24 }}>
        <button onClick={() => window.history.back()} style={{ background:'rgba(255,255,255,0.05)', border:'none', borderRadius:8, padding:'6px 12px', color:'#9ca3af', fontSize:12, cursor:'pointer', marginBottom:12 }}>← Back</button>
        <h1 style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>📱 MacroDroid + JARVIS</h1>
        <p style={{ fontSize:12, color:'#6b7280' }}>2-way bridge setup guide</p>
      </div>

      <Sec title="Step 1 — Install" color="#6366f1">
        <Stp n={1} text='Play Store → "MacroDroid" (free)' />
        <Stp n={2} text='Play Store → "ntfy" (free)' />
        <Stp n={3} text='ntfy app → Subscribe topic: jarvis-pranshu-2026' />
      </Sec>

      <Sec title="Step 2 — MacroDroid → JARVIS" color="#22c55e">
        <p style={{ fontSize:11, color:'#9ca3af', marginBottom:10 }}>Har macro mein yeh HTTP action add karo:</p>
        <CB label="URL" value="https://apple10.vercel.app/api/device" id="u" c={copied} s={copy} />
        <CB label="Method" value="POST" id="m" c={copied} s={copy} />
        <CB label="Header" value="x-jarvis-secret: jarvis2026" id="h" c={copied} s={copy} />

        {MACROS.map(cat => (
          <div key={cat.category} style={{ marginTop:14 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#4b5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>{cat.category}</div>
            {cat.macros.map(m => (
              <div key={m.name} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:9, padding:'8px 10px', marginBottom:4 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, fontWeight:600 }}>{m.icon} {m.name}</span>
                  <button onClick={() => copy(m.body, m.name)} style={{ background: copied===m.name ? '#22c55e' : 'rgba(99,102,241,0.15)', border:'none', borderRadius:5, padding:'3px 7px', color:'#a5b4fc', fontSize:10, cursor:'pointer' }}>
                    {copied===m.name ? '✓ Copied' : '📋 Body'}
                  </button>
                </div>
                <div style={{ fontSize:10, color:'#4b5563', marginTop:2 }}>Trigger: {m.trigger}</div>
                <code style={{ fontSize:10, color:'#6b7280', fontFamily:'monospace' }}>{m.body}</code>
              </div>
            ))}
          </div>
        ))}
      </Sec>

      <Sec title="Step 3 — JARVIS → Phone (voice/text commands)" color="#f59e0b">
        <p style={{ fontSize:11, color:'#9ca3af', marginBottom:10 }}>Chat mein directly bolo ya type karo:</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
          {CMD_EXAMPLES.map(c => (
            <div key={c.say} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, padding:'6px 9px' }}>
              <div style={{ fontSize:11, color:'#fbbf24', fontWeight:700 }}>{c.say}</div>
              <div style={{ fontSize:10, color:'#6b7280', marginTop:1 }}>{c.does}</div>
            </div>
          ))}
        </div>
      </Sec>

      <Sec title="⚠️ Vercel Env Vars (required)" color="#ef4444">
        <CB label="NTFY_TOPIC" value="jarvis-pranshu-2026" id="e1" c={copied} s={copy} />
        <CB label="MACRODROID_SECRET" value="jarvis2026" id="e2" c={copied} s={copy} />
        <p style={{ fontSize:11, color:'#6b7280', marginTop:8 }}>Vercel Dashboard → apple10 → Settings → Environment Variables → Add both</p>
      </Sec>
    </div>
  );
}

function Sec({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:16, background:'#0f1219', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:14 }}>
      <div style={{ fontSize:13, fontWeight:800, color, marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}
function Stp({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:7 }}>
      <span style={{ background:'rgba(99,102,241,0.2)', color:'#818cf8', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, flexShrink:0 }}>{n}</span>
      <span style={{ fontSize:12, color:'#cbd5e1' }}>{text}</span>
    </div>
  );
}
function CB({ label, value, id, c, s }: { label: string; value: string; id: string; c: string; s: (v: string, i: string) => void }) {
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ fontSize:10, color:'#4b5563', marginBottom:2 }}>{label}</div>
      <div style={{ display:'flex', gap:5 }}>
        <code style={{ flex:1, background:'#040507', border:'1px solid rgba(255,255,255,0.05)', borderRadius:6, padding:'5px 8px', fontSize:11, color:'#86efac', fontFamily:'monospace', overflowX:'auto', whiteSpace:'nowrap' }}>{value}</code>
        <button onClick={() => s(value, id)} style={{ background: c===id ? '#22c55e' : 'rgba(255,255,255,0.04)', border:'none', borderRadius:6, padding:'4px 8px', color:'#9ca3af', fontSize:10, cursor:'pointer', flexShrink:0 }}>
          {c===id ? '✓' : '📋'}
        </button>
      </div>
    </div>
  );
}
