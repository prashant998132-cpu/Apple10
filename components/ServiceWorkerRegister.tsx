'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[JARVIS SW] ✅ Registered:', reg.scope);
        reg.addEventListener('updatefound', () => {
          reg.installing?.addEventListener('statechange', function() {
            if (this.state === 'installed' && navigator.serviceWorker.controller) {
              this.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(err => console.log('[JARVIS SW] Failed:', err));

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'CHECK_REMINDERS') {
        try {
          const reminders = JSON.parse(localStorage.getItem('jarvis_reminders_list') || '[]');
          const now = Date.now();
          const due = reminders.filter((r: any) => {
            const [h, m] = (r.time || '00:00').split(':').map(Number);
            const t = new Date(); t.setHours(h, m, 0, 0);
            return Math.abs(t.getTime() - now) < 60000;
          });
          if (due.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
            due.forEach((r: any) => new Notification('⏰ JARVIS', { body: r.text, icon: '/icons/icon-192.png' }));
          }
        } catch {}
      }
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return null;
}
