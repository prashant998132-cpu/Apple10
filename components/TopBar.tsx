'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import ChatHistorySidebar from './ChatHistorySidebar';
import PWAInstall from './PWAInstall';

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
  const [mounted, setMounted]   = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close on outside click
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

  const menu = showMenu && mounted ? createPortal(
    <div ref={menuRef} style={{
      position: 'fixed', top: 48, right: 12, zIndex: 99999,
      background: '#13161f',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16, overflow: 'hidden', minWidth: 195,
      boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
      animation: 'fadeUp 0.18s ease',
    }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {PAGES.map((p, i) => (
        <Link key={p.href} href={p.href}
          onClick={() => setShowMenu(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 15px', color: '#e2e8f0', textDecoration: 'none',
            borderBottom: i < PAGES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{p.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{p.desc}</div>
          </div>
        </Link>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <>
      {/* TopBar — full pointer-events, nothing blocked */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'linear-gradient(to bottom, #0a0b0f 65%, transparent)',
      }}>
        {/* Left: history + indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChatHistorySidebar onSelect={onSessionSelect} currentSession={currentSession} />
          {toolsRunning && <span style={{ fontSize: 11, color: '#facc15' }}>🔧</span>}
          {puterReady   && <span style={{ fontSize: 10, color: 'rgba(34,197,94,0.5)' }}>⚡</span>}
          <PWAInstall />
        </div>

        {/* Right: ☰ button — pointer-events explicitly auto */}
        <button
          ref={btnRef}
          onClick={() => setShowMenu(s => !s)}
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: showMenu ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${showMenu ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: showMenu ? '#60a5fa' : '#9ca3af',
            fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto',  // explicit fix
            transition: 'all 0.15s',
          }}>
          ☰
        </button>
      </div>

      {menu}
    </>
  );
}
