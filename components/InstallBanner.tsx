'use client';
import { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [prompt, setPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true); return;
    }
    if ((navigator as any).standalone) { setInstalled(true); return; }
    // Check if dismissed
    const dismissed = localStorage.getItem('jarvis_install_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('jarvis_install_dismissed', Date.now().toString());
  };

  if (!show || installed) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 70, left: 12, right: 12, zIndex: 999,
      background: 'linear-gradient(135deg, #0d1117, #0a0c14)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 14, padding: '12px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slideUp 0.3s ease',
    }}>
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div style={{ fontSize: 32 }}>🤖</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0', marginBottom: 2 }}>JARVIS Install karo</div>
        <div style={{ fontSize: 10, color: '#475569' }}>Home screen pe add karo — faster, offline bhi</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={dismiss} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#6b7280', padding: '6px 10px', cursor: 'pointer', fontSize: 11 }}>
          Baad mein
        </button>
        <button onClick={install} style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
          Install
        </button>
      </div>
    </div>
  );
}
