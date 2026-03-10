'use client';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface ToastItem {
  id: string;
  message: string;
  icon?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

// Global toast queue
let _addToast: ((t: Omit<ToastItem,'id'>) => void) | null = null;

export function showToast(message: string, icon = '💬', type: ToastItem['type'] = 'info', duration = 4000) {
  _addToast?.({ message, icon, type, duration });
}

const TYPE_COLORS: Record<string, string> = {
  info:    'rgba(59,130,246,0.15)',
  success: 'rgba(34,197,94,0.15)',
  warning: 'rgba(245,158,11,0.15)',
  error:   'rgba(239,68,68,0.15)',
};
const TYPE_BORDERS: Record<string, string> = {
  info:    'rgba(59,130,246,0.3)',
  success: 'rgba(34,197,94,0.3)',
  warning: 'rgba(245,158,11,0.3)',
  error:   'rgba(239,68,68,0.3)',
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((t: Omit<ToastItem,'id'>) => {
    const id = `toast_${Date.now()}`;
    setToasts(prev => [...prev.slice(-4), { ...t, id }]); // max 5
    setTimeout(() => remove(id), t.duration ?? 4000);
  }, [remove]);

  useEffect(() => { _addToast = add; return () => { _addToast = null; }; }, [add]);

  if (!mounted) return null;

  return createPortal(
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: 'center', pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id}
          onClick={() => remove(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 14,
            background: TYPE_COLORS[t.type || 'info'],
            border: `1px solid ${TYPE_BORDERS[t.type || 'info']}`,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            cursor: 'pointer', pointerEvents: 'auto',
            animation: 'toastIn 0.25s cubic-bezier(0.4,0,0.2,1)',
            maxWidth: 320,
          }}>
          <style>{`
            @keyframes toastIn {
              from { opacity:0; transform:translateY(12px) scale(0.95); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
          `}</style>
          {t.icon && <span style={{ fontSize: 16 }}>{t.icon}</span>}
          <span style={{ fontSize: 13, color: '#e2e8f0', fontFamily: '-apple-system,sans-serif' }}>{t.message}</span>
          <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 4 }}>✕</span>
        </div>
      ))}
    </div>,
    document.body
  );
}
