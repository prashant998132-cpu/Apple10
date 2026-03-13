'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import ChatHistorySidebar from './ChatHistorySidebar';
import PWAInstall from './PWAInstall';

const PAGES = [
  { href: '/',            icon: '💬', label: 'Chat',      desc: 'Back to chat' },
  { href: '/tools',       icon: '🧰', label: 'Tools',     desc: '30+ calculators' },
  { href: '/vault',       icon: '🗄️', label: 'Vault',    desc: 'Media & notes' },
  { href: '/study',       icon: '📚', label: 'Study',     desc: 'MCQs & flashcards' },
  { href: '/target',      icon: '🎯', label: 'Goals',     desc: 'Track targets' },
  { href: '/macrodroid',  icon: '📱', label: 'MacroDroid', desc: 'Phone automation' },
  { href: '/settings',    icon: '⚙️', label: 'Settings',  desc: 'Apps & config' },
];

interface Props {
  onCompress: () => void;
  onSessionSelect: (id: string) => void;
  currentSession: string;
  toolsRunning?: boolean;
  puterReady?: boolean;
  wakeWordEnabled?: boolean;
  onWakeWordToggle?: () => void;
}

export default function TopBar({ onCompress, onSessionSelect, currentSession, toolsRunning, puterReady, wakeWordEnabled, onWakeWordToggle }: Props) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!showMenu) return;
    const close = (e: Event) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setShowMenu(false);
      }
    };
    // Both mouse AND touch
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [showMenu]);

  const navigate = (href: string) => {
    setShowMenu(false);
    router.push(href);
  };

  const menu = showMenu && mounted ? createPortal(
    <>
      <style>{`
        .jarvis-menu-item {
          display:flex; align-items:center; gap:14px; width:100%;
          padding:14px 16px; background:none; border:none;
          border-bottom:1px solid rgba(255,255,255,0.05);
          cursor:pointer; text-align:left;
          -webkit-tap-highlight-color: rgba(59,130,246,0.15);
          transition: background 0.1s;
        }
        .jarvis-menu-item:active { background: rgba(59,130,246,0.15) !important; }
        .jarvis-menu-item:last-child { border-bottom: none; }
        @keyframes menuFade {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
      `}</style>
      <div ref={menuRef} style={{
        position:'fixed', top:50, right:12, zIndex:99999,
        background:'#13161f',
        border:'1px solid rgba(255,255,255,0.12)',
        borderRadius:18, overflow:'hidden', minWidth:210,
        boxShadow:'0 20px 60px rgba(0,0,0,0.9)',
        animation:'menuFade 0.18s ease',
      }}>
        {PAGES.map(p => (
          <button key={p.href} className="jarvis-menu-item"
            onPointerDown={() => navigate(p.href)}>
            <span style={{fontSize:20, width:28, textAlign:'center'}}>{p.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:14, fontWeight:600, color:'#e2e8f0'}}>{p.label}</div>
              <div style={{fontSize:11, color:'#6b7280', marginTop:2}}>{p.desc}</div>
            </div>
          </button>
        ))}
        <div style={{height:1, background:'rgba(255,255,255,0.07)'}} />
        <button className="jarvis-menu-item"
          onPointerDown={() => { setShowMenu(false); onCompress(); }}>
          <span style={{fontSize:20, width:28, textAlign:'center'}}>✂️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14, fontWeight:600, color:'#9ca3af'}}>Compress</div>
            <div style={{fontSize:11, color:'#6b7280', marginTop:2}}>Context chhota karo</div>
          </div>
        </button>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <div style={{
        position:'sticky', top:0, zIndex:30,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 12px',
        background:'linear-gradient(to bottom, #0a0b0f 70%, transparent)',
      }}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <ChatHistorySidebar onSelect={onSessionSelect} currentSession={currentSession} />
          {toolsRunning && <span style={{fontSize:11, color:'#facc15'}}>🔧</span>}
          {puterReady   && <span style={{fontSize:10, color:'rgba(34,197,94,0.5)'}}>⚡</span>}
          <PWAInstall />
          {/* Wake Word Toggle */}
          {onWakeWordToggle && (
            <button
              onPointerDown={e => { e.stopPropagation(); onWakeWordToggle(); }}
              title={wakeWordEnabled ? '"Hey JARVIS" active' : 'Wake word off'}
              style={{
                width: 32, height: 32, borderRadius: 9, cursor: 'pointer',
                background: wakeWordEnabled ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${wakeWordEnabled ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: wakeWordEnabled ? '#818cf8' : '#4b5563',
                fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                animation: wakeWordEnabled ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                WebkitTapHighlightColor: 'transparent',
              }}>
              🎙
            </button>
          )}
        </div>

        <button ref={btnRef}
          onPointerDown={e => { e.stopPropagation(); setShowMenu(s => !s); }}
          style={{
            width:36, height:36, borderRadius:11, cursor:'pointer',
            background: showMenu ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.07)',
            border:`1.5px solid ${showMenu ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.12)'}`,
            color: showMenu ? '#60a5fa' : '#9ca3af',
            fontSize:17, display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.15s',
            WebkitTapHighlightColor:'transparent',
          }}>
          ☰
        </button>
      </div>
      {menu}
    </>
  );
}
