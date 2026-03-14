'use client';
import { useState, useEffect } from 'react';
import { requestAllPermissions, getStoredPermissions, type PermissionStatus } from '@/lib/permissions';

export default function PermissionsPage() {
  const [results, setResults] = useState<PermissionStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const stored = getStoredPermissions();
    if (stored) { setResults(stored); setDone(true); }
  }, []);

  const handleRequest = async () => {
    setLoading(true);
    const r = await requestAllPermissions();
    setResults(r);
    setLoading(false);
    setDone(true);
  };

  const granted = results.filter(r => r.granted).length;

  return (
    <div style={{ minHeight:'100vh', background:'#070810', color:'#e2e8f0', padding:'20px', fontFamily:'-apple-system,sans-serif', maxWidth:480, margin:'0 auto' }}>
      <div style={{ textAlign:'center', padding:'24px 0 20px' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔐</div>
        <h1 style={{ fontSize:22, fontWeight:900, background:'linear-gradient(135deg,#6366f1,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:6 }}>
          JARVIS Permissions
        </h1>
        <p style={{ fontSize:13, color:'#475569', lineHeight:1.5 }}>
          Ek baar allow karo — JARVIS poora phone use karega
        </p>
      </div>

      {!done && (
        <div style={{ background:'#0d0f18', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16, marginBottom:16 }}>
          {[
            ['🔔','Notifications','Reminders, alerts, morning brief'],
            ['📍','Location','Weather, local info, GPS'],
            ['📷','Camera','Photo analyze, QR scan'],
            ['🎤','Microphone','Voice commands'],
            ['📋','Clipboard','AI clipboard read'],
            ['👥','Contacts','"contact se call karo"'],
            ['🔵','Bluetooth','Device detect'],
            ['💾','Storage','Data persist'],
            ['📡','NFC','Tag read/write'],
            ['📱','Motion','Shake detect'],
          ].map(([emoji,name,desc]) => (
            <div key={name as string} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize:20, minWidth:28 }}>{emoji}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>{name}</div>
                <div style={{ fontSize:11, color:'#475569' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ background:'#0d0f18', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#86efac', marginBottom:12 }}>
            {granted}/{results.length} permissions granted
          </div>
          {results.map(r => (
            <div key={r.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize:13 }}>{r.emoji} {r.name}</span>
              <span style={{ fontSize:12, fontWeight:700, color:r.granted?'#22c55e':'#f87171' }}>
                {r.granted ? '✅ Allowed' : '❌ Denied'}
              </span>
            </div>
          ))}
        </div>
      )}

      {!done ? (
        <button onClick={handleRequest} disabled={loading}
          style={{ width:'100%', padding:16, background:'linear-gradient(135deg,#6366f1,#4f46e5)', border:'none', borderRadius:14, color:'#fff', fontSize:16, fontWeight:800, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1 }}>
          {loading ? '⏳ Requesting permissions...' : '🔐 Allow All Permissions'}
        </button>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={() => { window.location.href='/'; }}
            style={{ width:'100%', padding:14, background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:14, color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer' }}>
            🚀 JARVIS Kholo
          </button>
          <button onClick={() => { setDone(false); setResults([]); try{localStorage.removeItem('jarvis_permissions');}catch{} }}
            style={{ width:'100%', padding:10, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#475569', fontSize:12, cursor:'pointer' }}>
            Reset & Re-request
          </button>
        </div>
      )}

      <div style={{ marginTop:20, padding:'12px 14px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, fontSize:11, color:'#818cf8', lineHeight:1.7 }}>
        💡 <strong>Free APK banao:</strong> pwabuilder.com → apple10.vercel.app daalo → Android Package download → Install. Play Store jaisi feel + extra system permissions!
      </div>
    </div>
  );
}
