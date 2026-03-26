'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDeviceStatus } from '@/lib/deviceInfo';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [battery, setBattery] = useState<{level:number;charging:boolean}|null>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    getDeviceStatus().then(s => { if(s.battery) setBattery(s.battery as any); });
  }, []);

  const MAIN = [
    { path: '/',               icon: '🏠', label: 'Home' },
    { path: '/dashboard',      icon: '📊', label: 'Dash' },
    { path: '/image',          icon: '🎨', label: 'Image' },
    { path: '/entertainment',  icon: '🎬', label: 'Films' },
    { path: '/tools',          icon: '🧰', label: 'Tools' },
  ];

  const MORE = [
    { path: '/mitra',    icon: '🤝', label: 'Mitra' },
    { path: '/vault',    icon: '🗄️', label: 'Vault' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
    { path: '/india',    icon: '🇮🇳', label: 'India' },
  ];

  const allActive = [...MAIN, ...MORE].some(t => t.path === pathname);

  return (
    <>
      {/* More drawer */}
      {more && (
        <div onClick={() => setMore(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(0,0,0,0.5)' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', bottom: 62, left: 0, right: 0, background: 'rgba(10,12,20,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px 8px', display: 'flex', justifyContent: 'space-around' }}>
            {MORE.map(tab => {
              const active = pathname === tab.path;
              return (
                <button key={tab.path} onClick={() => { router.push(tab.path); setMore(false); }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 12,
                    background: active ? 'rgba(99,102,241,0.15)' : 'transparent' as any }}>
                  <span style={{ fontSize: 22 }}>{tab.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: active ? '#a78bfa' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(8,10,18,0.97)', backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(99,102,241,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: 'max(10px,env(safe-area-inset-bottom)) 0 10px', height: 62,
      }}>
        {MAIN.map(tab => {
          const active = pathname === tab.path;
          return (
            <button key={tab.path} onClick={() => { router.push(tab.path); setMore(false); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 10, transition: 'all 0.15s', opacity: active ? 1 : 0.45, transform: active ? 'scale(1.1)' : 'scale(1)', position: 'relative' }}>
              {active && <span style={{ position: 'absolute', top: -1, width: 20, height: 2, borderRadius: 1, background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />}
              <span style={{ fontSize: 19 }}>{tab.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: active ? '#a78bfa' : '#374151', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{tab.label}</span>
            </button>
          );
        })}

        {/* More button */}
        <button onClick={() => setMore(m => !m)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 10, opacity: more ? 1 : 0.45, transform: more ? 'scale(1.1)' : 'scale(1)' }}>
          <span style={{ fontSize: 19 }}>{more ? '✕' : '⋯'}</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: more ? '#a78bfa' : '#374151', textTransform: 'uppercase' }}>More</span>
        </button>

        {battery && (
          <div style={{ position: 'absolute', top: -18, right: 10, fontSize: 9, color: '#374151', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span>{battery.charging ? '⚡' : battery.level > 50 ? '🔋' : '🪫'}</span>
            <span style={{ color: battery.level < 20 ? '#f87171' : '#374151' }}>{battery.level}%</span>
          </div>
        )}
      </nav>
    </>
  );
}
