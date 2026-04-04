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
    { path: '/',              icon: '🏠', label: 'Home' },
    { path: '/dashboard',     icon: '📊', label: 'Dash' },
    { path: '/image',         icon: '🎨', label: 'Image' },
    { path: '/entertainment', icon: '🎬', label: 'Films' },
    { path: '/tools',         icon: '🧰', label: 'Tools' },
  ];

  // Clean — no duplicates
  const MORE_PAGES = [
    { path: '/habits',      icon: '🔥', label: 'Habits' },
    { path: '/reader',      icon: '📄', label: 'Reader' },
    { path: '/notes',       icon: '📝', label: 'Notes' },
    { path: '/stats',       icon: '📈', label: 'Stats' },
    { path: '/mitra',       icon: '🤝', label: 'Mitra' },
    { path: '/quiz',        icon: '🧠', label: 'Quiz'  },
    { path: '/vault',       icon: '🗄️', label: 'Vault' },
    { path: '/neet',        icon: '🎓', label: 'NEET' },
    { path: '/target',      icon: '🎯', label: 'Goals' },
    { path: '/india',       icon: '🇮🇳', label: 'India' },
    { path: '/settings',    icon: '⚙️', label: 'Settings' },
  ];

  const isMoreActive = MORE_PAGES.some(p => p.path === pathname);

  return (
    <>
      {more && (
        <div onClick={() => setMore(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', bottom: 62, left: 0, right: 0, background: 'rgba(8,10,18,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px 10px' }}>
            <div style={{ fontSize: 10, color: '#374151', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>More Pages</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {MORE_PAGES.map(tab => {
                const active = pathname === tab.path;
                return (
                  <button key={tab.path} onClick={() => { router.push(tab.path); setMore(false); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: active ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 4px', cursor: 'pointer' }}>
                    <span style={{ fontSize: 22 }}>{tab.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: active ? '#a78bfa' : '#6b7280', textTransform: 'uppercase' }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(8,10,18,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: 'max(10px,env(safe-area-inset-bottom)) 0 10px', height: 62 }}>
        {MAIN.map(tab => {
          const active = pathname === tab.path;
          return (
            <button key={tab.path} onClick={() => { router.push(tab.path); setMore(false); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 10, opacity: active ? 1 : 0.45, transform: active ? 'scale(1.1)' : 'scale(1)', position: 'relative', transition: 'all 0.15s' }}>
              {active && <span style={{ position: 'absolute', top: -1, width: 20, height: 2, borderRadius: 1, background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />}
              <span style={{ fontSize: 19 }}>{tab.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: active ? '#a78bfa' : '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tab.label}</span>
            </button>
          );
        })}
        <button onClick={() => setMore(m => !m)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 10, opacity: (more || isMoreActive) ? 1 : 0.45, transform: (more || isMoreActive) ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.15s', position: 'relative' }}>
          {isMoreActive && !more && <span style={{ position: 'absolute', top: -1, width: 20, height: 2, borderRadius: 1, background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />}
          <span style={{ fontSize: 19, transition: 'transform 0.2s', display: 'inline-block', transform: more ? 'rotate(45deg)' : 'none' }}>{more ? '✕' : '⋯'}</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: (more || isMoreActive) ? '#a78bfa' : '#374151', textTransform: 'uppercase' }}>More</span>
        </button>

        {battery && (
          <div style={{ position: 'absolute', top: -18, right: 10, fontSize: 9, color: battery.level < 20 ? '#f87171' : '#374151', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span>{battery.charging ? '⚡' : battery.level > 50 ? '🔋' : '🪫'}</span>
            <span>{battery.level}%</span>
          </div>
        )}
      </nav>
    </>
  );
}
