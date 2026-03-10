'use client';
import { useState, useEffect } from 'react';

export default function PWAInstall() {
  const [prompt, setPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true); return;
    }
    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setShow(false); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (installed || !show || !prompt) return null;

  const install = async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') { setInstalled(true); setShow(false); }
    else setShow(false);
  };

  return (
    <button onClick={install}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', borderRadius: 10,
        background: 'rgba(59,130,246,0.12)',
        border: '1px solid rgba(59,130,246,0.25)',
        color: '#60a5fa', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      title="Install JARVIS as app">
      📲 Install
    </button>
  );
}
