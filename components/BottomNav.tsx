'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDeviceStatus } from '@/lib/deviceInfo';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    getDeviceStatus().then(s => { if (s.battery) setBattery(s.battery as any); });
  }, []);

  const MAIN = [
    { path: '/',          icon: '🏠', label: 'Home'   },
    { path: '/dashboard', icon: '📊', label: 'Dash'   },
    { path: '/finance',   icon: '💰', label: 'Finance' },
    { path: '/todo',      icon: '✅', label: 'To-Do'  },
    { path: '/tools',     icon: '🧰', label: 'Tools'  },
  ];

  const MORE_PAGES = [
    { path: '/calculator',   icon: '🧮', label: 'Calc'    },
    { path: '/habits',       icon: '🔥', label: 'Habits'  },
    { path: '/reader',       icon: '📄', label: 'Reader'  },
    { path: '/notes',        icon: '📝', label: 'Notes'   },
    { path: '/stats',        icon: '📈', label: 'Stats'   },
    { path: '/mitra',        icon: '🤝', label: 'Mitra'   },
    { path: '/vault',        icon: '🗄️', label: 'Vault'   },
    { path: '/neet',         icon: '🎓', label: 'NEET'    },
    { path: '/target',       icon: '🎯', label: 'Goals'   },
    { path: '/india',        icon: '🇮🇳', label: 'India'   },
    { path: '/quiz',         icon: '🧠', label: 'Quiz'    },
    { path: '/image',        icon: '🎨', label: 'Image'   },
    { path: '/entertainment',icon: '🎬', label: 'Films'   },
    { path: '/settings',     icon: '⚙️', label: 'Settings'},
  ];

  const isMoreActive = MORE_PAGES.some(p => p.path === pathname);

  const battPct = battery ? Math.round(battery.level * 100) : null;
  const battColor = battPct !== null ? (battPct > 50 ? '#22c55e' : battPct > 20 ? '#f59e0b' : '#ef4444') : '#6b7280';

  return (
    <>
      {more && (
        <div onClick={() => setMore(false)}
          style={{ position:'fixed', inset:0, zIndex:98, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position:'absolute', bottom:62, left:0, right:0, background:'rgba(8,10,18,0.98)', backdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.08)', padding:'14px 16px 10px' }}>
            {/* Battery info */}
            {battPct !== null && (
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                <span style={{ fontSize:10, color:'#374151' }}>Battery:</span>
                <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.07)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ width:battPct+'%', height:'100%', background:battColor, borderRadius:99 }}/>
                </div>
                <span style={{ fontSize:10, color:battColor, fontWeight:700 }}>{battPct}%{battery?.charging?' ⚡':''}</span>
              </div>
            )}
            <div style={{ fontSize:10, color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>More Pages</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {MORE_PAGES.map(tab => {
                const active = pathname === tab.path;
                return (
                  <button key={tab.path} onClick={() => { router.push(tab.path); setMore(false); }}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, background:active?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.03)', border:'1px solid', borderColor:active?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 4px', cursor:'pointer' }}>
                    <span style={{ fontSize:22 }}>{tab.icon}</span>
                    <span style={{ fontSize:9, fontWeight:700, color:active?'#a78bfa':'#6b7280', textTransform:'uppercase' }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:99, background:'rgba(8,10,18,0.97)', backdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', height:62, paddingBottom:'env(safe-area-inset-bottom,0)' }}>
        {MAIN.map(tab => {
          const active = pathname === tab.path;
          return (
            <button key={tab.path} onClick={() => { router.push(tab.path); setMore(false); }}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, background:'none', border:'none', cursor:'pointer', position:'relative' }}>
              {active && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:28, height:2, background:'#6366f1', borderRadius:'0 0 3px 3px' }}/>}
              <span style={{ fontSize:20 }}>{tab.icon}</span>
              <span style={{ fontSize:9, fontWeight:700, color:active?'#a78bfa':'#4b5563', textTransform:'uppercase' }}>{tab.label}</span>
            </button>
          );
        })}
        {/* More button */}
        <button onClick={() => setMore(m => !m)}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, background:'none', border:'none', cursor:'pointer', position:'relative' }}>
          {isMoreActive && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:28, height:2, background:'#6366f1', borderRadius:'0 0 3px 3px' }}/>}
          {more
            ? <span style={{ fontSize:20 }}>✕</span>
            : <span style={{ fontSize:20 }}>⋯</span>}
          <span style={{ fontSize:9, fontWeight:700, color:isMoreActive||more?'#a78bfa':'#4b5563', textTransform:'uppercase' }}>More</span>
        </button>
      </nav>
    </>
  );
}
