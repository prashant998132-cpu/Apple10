'use client';
import { useState, useEffect } from 'react';
import { getDeviceStatus, watchBattery, DeviceStatus } from '@/lib/deviceInfo';

export default function DeviceStatusBar() {
  const [status, setStatus] = useState<DeviceStatus>({ battery: null, network: null, memory: null });

  useEffect(() => {
    getDeviceStatus().then(setStatus);

    // Live battery
    const unwatch = watchBattery((b) => {
      setStatus(prev => ({ ...prev, battery: { ...b, time: '' } }));
    });

    // Network changes
    const handleOnline = () => getDeviceStatus().then(setStatus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOnline);

    const interval = setInterval(() => getDeviceStatus().then(setStatus), 30000);

    return () => {
      unwatch();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOnline);
      clearInterval(interval);
    };
  }, []);

  if (!status.battery && !status.network) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      gap: 10, padding: '4px 12px',
      background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.04)',
      fontSize: 10, color: '#6b7280',
    }}>
      {status.network && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span>{status.network.online ? (status.network.type.includes('WiFi') ? '📶' : '📡') : '📵'}</span>
          <span style={{ color: status.network.online ? '#6b7280' : '#f87171' }}>
            {status.network.type}
            {status.network.downlink > 0 && ` · ${status.network.downlink}Mbps`}
          </span>
        </span>
      )}
      {status.battery && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span>{status.battery.charging ? '⚡' : status.battery.level > 50 ? '🔋' : status.battery.level > 20 ? '🪫' : '🔴'}</span>
          <span style={{ color: status.battery.level < 20 ? '#f87171' : '#6b7280' }}>
            {status.battery.level}%
          </span>
          {/* Battery bar */}
          <div style={{
            width: 24, height: 8, border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 2, overflow: 'hidden', position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: status.battery.level + '%',
              background: status.battery.level > 50 ? '#22c55e' : status.battery.level > 20 ? '#f59e0b' : '#ef4444',
              transition: 'width 0.5s',
            }} />
          </div>
        </span>
      )}
    </div>
  );
}
