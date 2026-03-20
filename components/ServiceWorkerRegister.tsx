'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Register SW
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[JARVIS SW] Registered:', reg.scope);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available - silently update
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((err) => console.log('[JARVIS SW] Registration failed:', err));

    // Register periodic background sync
    navigator.serviceWorker.ready.then((reg) => {
      // @ts-ignore
      if ('periodicSync' in reg) {
        // @ts-ignore
        reg.periodicSync.register('update-weather', { minInterval: 60 * 60 * 1000 }) // 1 hour
          .catch(() => {}); // Ignore if not permitted
        // @ts-ignore
        reg.periodicSync.register('check-reminders', { minInterval: 15 * 60 * 1000 }) // 15 min
          .catch(() => {});
      }
    }).catch(() => {});

    // Listen for SW messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        // Handle notification click
        window.location.href = event.data.url || '/';
      }
      if (event.data?.type === 'CHECK_REMINDERS') {
        // Check localStorage for pending reminders
        try {
          const reminders = JSON.parse(localStorage.getItem('jarvis_reminders') || '[]');
          const now = Date.now();
          const due = reminders.filter((r: any) => r.time <= now);
          if (due.length > 0) {
            due.forEach((r: any) => {
              new Notification('⏰ JARVIS Reminder', { body: r.text, icon: '/icons/icon-192.png' });
            });
            localStorage.setItem('jarvis_reminders',
              JSON.stringify(reminders.filter((r: any) => r.time > now)));
          }
        } catch {}
      }
    });

  }, []);

  return null; // Invisible component
}
