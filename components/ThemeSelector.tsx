'use client';
import { useState, useEffect } from 'react';
import { THEMES, applyTheme, getActiveThemeId } from '@/lib/themeEngine';

interface Props {
  onClose?: () => void;
  inline?: boolean;
}

export default function ThemeSelector({ onClose, inline }: Props) {
  const [active, setActive] = useState('dark');

  useEffect(() => {
    setActive(getActiveThemeId());
  }, []);

  function select(id: string) {
    setActive(id);
    applyTheme(id);
    if (onClose) setTimeout(onClose, 300);
  }

  const container: React.CSSProperties = inline
    ? { padding: '0' }
    : {
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      };

  const sheet: React.CSSProperties = inline
    ? {}
    : {
        background: '#0a0c14', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px 20px 0 0', padding: '20px 16px 32px',
        width: '100%', maxWidth: 480,
      };

  return (
    <div style={container} onClick={!inline ? onClose : undefined}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        {!inline && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0' }}>🎨 Theme Chuno</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 20, cursor: 'pointer' }}>×</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
          {THEMES.map(t => (
            <button key={t.id} onClick={() => select(t.id)}
              style={{
                background: active === t.id ? `${t.vars['--accent']}22` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${active === t.id ? t.vars['--accent'] : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 14, padding: '12px 4px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                transition: 'all 0.2s',
              }}>
              <span style={{ fontSize: 22 }}>{t.emoji}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: active === t.id ? t.vars['--accent'] : '#6b7280', textTransform: 'uppercase' }}>
                {t.name}
              </span>
              {/* Color swatch */}
              <div style={{ display: 'flex', gap: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: t.vars['--accent'] }} />
                <div style={{ width: 8, height: 8, borderRadius: 99, background: t.vars['--bg-card'] || '#0d1117' }} />
              </div>
            </button>
          ))}
        </div>

        {!inline && (
          <p style={{ fontSize: 10, color: '#374151', textAlign: 'center', marginTop: 12 }}>
            Theme turant apply hoti hai ✨
          </p>
        )}
      </div>
    </div>
  );
}
