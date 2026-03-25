'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import ChatHistorySidebar from './ChatHistorySidebar';
import PWAInstall from './PWAInstall';

const PAGES = [
  { href: '/',           icon: '💬', label: 'Chat',        desc: 'Back to chat' },
  { href: '/tools',      icon: '🧰', label: 'Tools',       desc: '30+ calculators' },
  { href: '/vault',      icon: '🗄️', label: 'Vault',      desc: 'Media & notes' },
  { href: '/image',      icon: '🎨', label: 'Image Gen',   desc: 'AI image banao' },
  { href: '/target',     icon: '🎯', label: 'Goals',       desc: 'Track targets' },
  { href: '/settings',   icon: '⚙️', label: 'Settings',   desc: 'Apps & config' },
];

interface Props {
  onCompress: () => void;
  onSessionSelect: (id: string) => void;
  currentSession: string;
  toolsRunning?: boolean;
  puterReady?: boolean;
  wakeWordEnabled?: boolean;
  onWakeWordToggle?: () => void;
  onSearch?: () => void;
  onExport?: () => void;
  messageCount?: number;
}

export default function TopBar({ onCompress, onSessionSelect, currentSession, toolsRunning, puterReady, wakeWordEnabled, onWakeWordToggle, onSearch, onExport, messageCount = 0 }: Props) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    // Load saved theme
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('jarvis_theme') : 'dark';
    setIsDark(saved !== 'light');
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('jarvis_theme', next); } catch {}
  };

  useEffect(() => {
    if (!showMenu) return;
    const close = (e: Event) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setShowMenu(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); };
  }, [showMenu]);

  const navigate = (href: string) => { setShowMenu(false); router.push(href); };

  const menu = showMenu && mounted ? createPortal(
    <>
      <style>{`
        .jarvis-menu-item { display:flex; align-items:center; gap:14px; width:100%; padding:14px 16px; background:none; border:none; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; text-align:left; -webkit-tap-highlight-color:rgba(59,130,246,0.15); transition:background 0.1s; }
        .jarvis-menu-item:active { background:rgba(59,130,246,0.15) !important; }
        .jarvis-menu-item:last-child { border-bottom:none; }
        @keyframes menuFade { from { opacity:0; transform:translateY(-8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>
      <div ref={menuRef} style={{ position:'fixed', top:50, right:12, zIndex:99999, background:'#13161f', border:'1px solid rgba(255,255,255,0.12)', borderRadius:18, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.7)', animation:'menuFade 0.18s ease', minWidth:220 }}>
        {/* Chat actions */}
        {messageCount > 0 && (
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '6px 8px' }}>
            <button className="jarvis-menu-item" onClick={() => { onSearch?.(); setShowMenu(false); }}
              style={{ borderRadius: 10, borderBottom: 'none', padding: '10px 12px' }}>
              <span style={{ fontSize: 18 }}>🔍</span>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Search</div><div style={{ fontSize: 11, color: '#6b7280' }}>Messages mein dhundho</div></div>
            </button>
            <button className="jarvis-menu-item" onClick={() => { onExport?.(); setShowMenu(false); }}
              style={{ borderRadius: 10, borderBottom: 'none', padding: '10px 12px' }}>
              <span style={{ fontSize: 18 }}>📥</span>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Export Chat</div><div style={{ fontSize: 11, color: '#6b7280' }}>Text file mein save karo</div></div>
            </button>
          </div>
        )}
        {/* Pages */}
        {PAGES.map(p => (
          <button key={p.href} className="jarvis-menu-item" onClick={() => navigate(p.href)}>
            <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{p.icon}</span>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{p.label}</div><div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{p.desc}</div></div>
          </button>
        ))}
        {/* Compress */}
        <button className="jarvis-menu-item" onClick={() => { onCompress(); setShowMenu(false); }}>
          <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>✂️</span>
          <div><div style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>Compress</div><div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Context chhota karo</div></div>
        </button>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <div style={{ position:'sticky', top:0, zIndex:30, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'linear-gradient(to bottom, #0a0b0f 70%, transparent)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <ChatHistorySidebar onSelect={onSessionSelect} currentSession={currentSession} />
          {toolsRunning && <span style={{ fontSize:11, color:'#facc15' }}>🔧</span>}
          {puterReady   && <span style={{ fontSize:10, color:'rgba(34,197,94,0.5)' }}>⚡</span>}
          <PWAInstall />
          {onWakeWordToggle && (
            <button onPointerDown={e => { e.stopPropagation(); onWakeWordToggle(); }}
              title={wakeWordEnabled ? '"Hey JARVIS" active' : 'Wake word off'}
              style={{ width:32, height:32, borderRadius:9, cursor:'pointer', background: wakeWordEnabled ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)', border:`1.5px solid ${wakeWordEnabled ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`, color: wakeWordEnabled ? '#818cf8' : '#4b5563', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', WebkitTapHighlightColor:'transparent' }}>
              🎙
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* 🌙/☀️ Theme Toggle */}
          <button onClick={toggleTheme}
            title={isDark ? 'Light mode' : 'Dark mode'}
            style={{ width:32, height:32, borderRadius:9, cursor:'pointer', background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(255,255,255,0.1)', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', WebkitTapHighlightColor:'transparent' }}>
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Search */}
          {onSearch && messageCount > 0 && (
            <button onPointerDown={e => { e.stopPropagation(); onSearch(); }}
              style={{ width:32, height:32, borderRadius:9, cursor:'pointer', background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(255,255,255,0.1)', color:'#6b7280', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent' }}>
              🔍
            </button>
          )}

          <button ref={btnRef} onPointerDown={e => { e.stopPropagation(); setShowMenu(s => !s); }}
            style={{ width:36, height:36, borderRadius:11, cursor:'pointer', background: showMenu ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.07)', border:`1.5px solid ${showMenu ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.12)'}`, color: showMenu ? '#60a5fa' : '#9ca3af', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', WebkitTapHighlightColor:'transparent' }}>
            ☰
          </button>
        </div>
      </div>
      {menu}
    </>
  );
}
