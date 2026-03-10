'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import ChatHistorySidebar from './ChatHistorySidebar';

const PAGES = [
  { href: '/',         icon: '💬', label: 'Chat',     desc: 'Back to chat' },
  { href: '/tools',    icon: '🧰', label: 'Tools',    desc: '30+ integrations' },
  { href: '/vault',    icon: '🗄️', label: 'Vault',   desc: 'Saved notes' },
  { href: '/study',    icon: '📚', label: 'Study',    desc: 'Learn anything' },
  { href: '/target',   icon: '🎯', label: 'Goals',    desc: 'Track targets' },
  { href: '/settings', icon: '⚙️', label: 'Settings', desc: 'Configure JARVIS' },
];

interface Props {
  onCompress: () => void;
  onSessionSelect: (id: string) => void;
  currentSession: string;
  toolsRunning?: boolean;
  puterReady?: boolean;
}

export default function TopBar({ onCompress, onSessionSelect, currentSession, toolsRunning, puterReady }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!showMenu) return;
    const h = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showMenu]);

  const menu = showMenu && mounted ? createPortal(
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 99997 }} onClick={() => setShowMenu(false)} />
      {/* Menu */}
      <div className="fade-in-fast" style={{
        position: 'fixed', top: 44, right: 14, zIndex: 99998,
        background: '#13161f',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 18, overflow: 'hidden', minWidth: 190,
        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
      }}>
        {PAGES.map((p, i) => (
          <Link key={p.href} href={p.href}
            onClick={() => setShowMenu(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 16px', color: '#e2e8f0', textDecoration: 'none',
              borderBottom: i < PAGES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: 17, width: 22, textAlign: 'center' }}>{p.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{p.label}</div>
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{p.desc}</div>
            </div>
          </Link>
        ))}
        {/* Compress option */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0 0' }} />
        <button
          onClick={() => { setShowMenu(false); onCompress(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
            padding: '11px 16px', color: '#9ca3af', background: 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 17, width: 22, textAlign: 'center' }}>✂️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>Compress</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>Context chhota karo</div>
          </div>
        </button>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between px-3 py-2 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, #0a0b0f 60%, transparent)' }}>

        {/* Left: history + status indicators */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <ChatHistorySidebar onSelect={onSessionSelect} currentSession={currentSession} />
          {toolsRunning && (
            <span className="text-[10px] text-yellow-400 animate-pulse font-medium">🔧</span>
          )}
          {puterReady && (
            <span className="text-[9px] text-green-500/50 font-medium">⚡</span>
          )}
        </div>

        {/* Right: ☰ menu button */}
        <button ref={btnRef}
          onClick={() => setShowMenu(s => !s)}
          className="pointer-events-auto flex items-center justify-center transition-all"
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: showMenu ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showMenu ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: showMenu ? '#60a5fa' : '#9ca3af',
            fontSize: 14, fontWeight: 600,
          }}>
          ☰
        </button>
      </div>

      {menu}
    </>
  );
}
