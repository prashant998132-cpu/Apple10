'use client';

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [
  {
    id: 'dark',
    name: 'Dark',
    emoji: '🌑',
    desc: 'Classic dark — easy on eyes',
    vars: {
      '--bg-primary': '#070810',
      '--bg-secondary': '#0a0c14',
      '--bg-card': '#0d1117',
      '--border': 'rgba(255,255,255,0.07)',
      '--text-primary': '#e2e8f0',
      '--text-muted': '#6b7280',
      '--accent': '#6366f1',
      '--accent-glow': 'rgba(99,102,241,0.2)',
      '--orb-idle': '#f59e0b',
      '--nav-bg': 'rgba(8,10,18,0.98)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌌',
    desc: 'Deep purple night sky',
    vars: {
      '--bg-primary': '#050008',
      '--bg-secondary': '#0c0014',
      '--bg-card': '#100018',
      '--border': 'rgba(167,139,250,0.1)',
      '--text-primary': '#ede9fe',
      '--text-muted': '#7c3aed',
      '--accent': '#a78bfa',
      '--accent-glow': 'rgba(167,139,250,0.2)',
      '--orb-idle': '#a78bfa',
      '--nav-bg': 'rgba(5,0,8,0.98)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    desc: 'Deep sea blue vibes',
    vars: {
      '--bg-primary': '#020d18',
      '--bg-secondary': '#041626',
      '--bg-card': '#061c30',
      '--border': 'rgba(34,211,238,0.08)',
      '--text-primary': '#e0f2fe',
      '--text-muted': '#0891b2',
      '--accent': '#22d3ee',
      '--accent-glow': 'rgba(34,211,238,0.15)',
      '--orb-idle': '#22d3ee',
      '--nav-bg': 'rgba(2,13,24,0.98)',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    desc: 'Calm nature green',
    vars: {
      '--bg-primary': '#020a04',
      '--bg-secondary': '#051209',
      '--bg-card': '#071810',
      '--border': 'rgba(34,197,94,0.08)',
      '--text-primary': '#dcfce7',
      '--text-muted': '#16a34a',
      '--accent': '#22c55e',
      '--accent-glow': 'rgba(34,197,94,0.15)',
      '--orb-idle': '#22c55e',
      '--nav-bg': 'rgba(2,10,4,0.98)',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    desc: 'Warm orange & red tones',
    vars: {
      '--bg-primary': '#0d0600',
      '--bg-secondary': '#150a00',
      '--bg-card': '#1c0e00',
      '--border': 'rgba(251,146,60,0.1)',
      '--text-primary': '#ffedd5',
      '--text-muted': '#ea580c',
      '--accent': '#fb923c',
      '--accent-glow': 'rgba(251,146,60,0.2)',
      '--orb-idle': '#fb923c',
      '--nav-bg': 'rgba(13,6,0,0.98)',
    },
  },
];

export function applyTheme(themeId: string) {
  if (typeof document === 'undefined') return;
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
  try { localStorage.setItem('jarvis_theme_id', themeId); } catch {}
}

export function getActiveThemeId(): string {
  if (typeof window === 'undefined') return 'dark';
  try { return localStorage.getItem('jarvis_theme_id') || 'dark'; } catch { return 'dark'; }
}

export function initTheme() {
  if (typeof document === 'undefined') return;
  const id = getActiveThemeId();
  applyTheme(id);
}
