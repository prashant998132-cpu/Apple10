'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDeviceStatus } from '@/lib/deviceInfo';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [battery, setBattery] = useState(null);

  useEffect(() => {
    getDeviceStatus().then(s => { if(s.battery) setBattery(s.battery); });
  }, []);

  const tabs = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/image', icon: '🎨', label: 'Image' },
    { path: '/tools', icon: '🧰', label: 'Tools' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,11,15,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: 'max(8px, env(safe-area-inset-bottom)) 0 8px', height: 60 }}>
      {tabs.map(tab => {
        const active = pathname === tab.path;
        return (
          <button key={tab.path} onClick={() => router.push(tab.path)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 10, transition: 'all 0.15s', opacity: active ? 1 : 0.45, transform: active ? 'scale(1.08)' : 'scale(1)' }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: active ? '#22d3ee' : '#6b7280', letterSpacing: '0.04em' }}>{tab.label}</span>
          </button>
        );
      })}
      {battery && (
        <div style={{ position: 'absolute', top: -18, right: 10, fontSize: 9, color: '#374151', display: 'flex', alignItems: 'center', gap: 3 }}>
          <span>{battery.charging ? '⚡' : battery.level > 50 ? '🔋' : '🪫'}</span>
          <span>{battery.level}%</span>
        </div>
      )}
    </nav>
  );
}