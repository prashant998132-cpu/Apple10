'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import ChatHistorySidebar from './ChatHistorySidebar';

const PAGES = [
  { href: '/',         icon: '💬', label: 'Chat' },
  { href: '/tools',    icon: '🧰', label: 'Tools' },
  { href: '/vault',    icon: '🗄️', label: 'Vault' },
  { href: '/study',    icon: '📚', label: 'Study' },
  { href: '/target',   icon: '🎯', label: 'Goals' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
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
    <div style={{
      position: 'fixed', top: 40, right: 16, zIndex: 99998,
      background: '#161b26', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, overflow: 'hidden', minWidth: 160,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
    }}>
      {PAGES.map(p => (
        <Link key={p.href} href={p.href}
          onClick={() => setShowMenu(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', color: '#e2e8f0', textDecoration: 'none',
            fontSize: 14, fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.04)'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 18 }}>{p.icon}</span>
          {p.label}
        </Link>
      ))}
      <button
        onClick={() => { setShowMenu(false); onCompress(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: '12px 16px', color: '#94a3b8', background: 'none',
          border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left'
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ fontSize: 18 }}>✂️</span>
        Compress
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2
        bg-gradient-to-b from-[#0a0b0f] to-transparent pointer-events-none">

        {/* Left: history + status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <ChatHistorySidebar onSelect={onSessionSelect} currentSession={currentSession} />
          {toolsRunning && <span className="text-[10px] text-yellow-400 animate-pulse">🔧</span>}
          {puterReady && <span className="text-[9px] text-green-500/60">⚡</span>}
        </div>

        {/* Right: single menu button */}
        <button ref={btnRef}
          onClick={() => setShowMenu(s => !s)}
          className="pointer-events-auto w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{
            background: showMenu ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: showMenu ? '#60a5fa' : '#94a3b8',
            fontSize: 16
          }}>
          ☰
        </button>
      </div>

      {menu}
    </>
  );
}
