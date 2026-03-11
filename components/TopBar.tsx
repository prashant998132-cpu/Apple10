'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import ChatHistorySidebar from './ChatHistorySidebar';
import PWAInstall from './PWAInstall';

const PAGES = [
  { href: '/',         icon: '💬', label: 'Chat',     desc: 'Back to chat' },
  { href: '/tools',    icon: '🧰', label: 'Tools',    desc: '30+ calculators' },
  { href: '/vault',    icon: '🗄️', label: 'Vault',   desc: 'Media & notes' },
  { href: '/study',    icon: '📚', label: 'Study',    desc: 'MCQs & flashcards' },
  { href: '/target',   icon: '🎯', label: 'Goals',    desc: 'Track targets' },
  { href: '/settings', icon: '⚙️', label: 'Settings', desc: 'Apps & config' },
];

interface Props {
  onCompress: () => void;
  onSessionSelect: (id: string) => void;
  currentSession: string;
  toolsRunning?: boolean;
  puterReady?: boolean;
}

export default function TopBar({ onCompress, onSessionSelect, currentSession, toolsRunning, puterReady }: Props) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!showMenu) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showMenu]);

  const navigate = (href: string) => {
    setShowMenu(false);
    // Small delay so menu closes before navigation renders
    setTimeout(() => router.push(href), 80);
  };

  const menu = showMenu && mounted ? createPortal(
    <div ref={menuRef} style={{
      position: 'fixed', top: 50, right: 12, zIndex: 99999,
      background: '#13161f',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16, overflow: 'hidden', minWidth: 200,
      boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
      animation: 'menuFade 0.15s ease',
    }}>
      <style>{`@keyframes menuFade{from{opacity:0;transform:translateY(-8px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>

      {PAGES.map((p, i) => (
        <button key={p.href}
          onClick={() => navigate(p.href)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
            padding: '12px 16px', background: 'none', border: 'none',
            borderBottom: i < PAGES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
          <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{p.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{p.label}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{p.desc}</div>
          </div>
        </button>
      ))}

      {/* Compress */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
      <button
        onClick={() => { setShowMenu(false); onCompress(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
        <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>✂️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>Compress</div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>Context chhota karo</div>
        </div>
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'linear-gradient(to bottom, #0a0b0f 65%, transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChatHistorySidebar onSelect={onSessionSelect} currentSession={currentSession} />
          {toolsRunning && <span style={{ fontSize: 11, color: '#facc15' }}>🔧</span>}
          {puterReady   && <span style={{ fontSize: 10, color: 'rgba(34,197,94,0.5)' }}>⚡</span>}
          <PWAInstall />
        </div>

        <button ref={btnRef}
          onClick={() => setShowMenu(s => !s)}
          style={{
            width: 34, height: 34, borderRadius: 10, cursor: 'pointer',
            background: showMenu ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${showMenu ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: showMenu ? '#60a5fa' : '#9ca3af',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
          ☰
        </button>
      </div>
      {menu}
    </>
  );
}
