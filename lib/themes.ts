'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS THEME SYSTEM — v31
// Research: Top chat apps have 12+ themes. OLED saves battery.
// Themes: OLED, Dracula, Nord, Catppuccin, Solarized, Default
// Stored in localStorage, applied instantly via CSS vars
// ══════════════════════════════════════════════════════════════

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  bg: string;         // Main background
  surface: string;    // Card/bubble surface
  border: string;     // Border color
  text: string;       // Primary text
  textMuted: string;  // Secondary text
  accent: string;     // Accent/brand color
  accentBg: string;   // Accent background (bubbles)
  userBubble: string; // User message bg
  userBubbleBorder: string;
  fontFamily: string;
}

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'JARVIS Dark',
    emoji: '🤖',
    bg: '#0a0b0f',
    surface: '#0d0f18',
    border: 'rgba(255,255,255,0.07)',
    text: '#e2e8f0',
    textMuted: '#475569',
    accent: '#6366f1',
    accentBg: 'rgba(99,102,241,0.12)',
    userBubble: 'rgba(59,130,246,0.12)',
    userBubbleBorder: 'rgba(59,130,246,0.2)',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  },
  {
    id: 'oled',
    name: 'OLED Black',
    emoji: '⬛',
    bg: '#000000',
    surface: '#0a0a0a',
    border: 'rgba(255,255,255,0.05)',
    text: '#ffffff',
    textMuted: '#444444',
    accent: '#00ff88',
    accentBg: 'rgba(0,255,136,0.08)',
    userBubble: 'rgba(0,255,136,0.08)',
    userBubbleBorder: 'rgba(0,255,136,0.2)',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  },
  {
    id: 'dracula',
    name: 'Dracula',
    emoji: '🧛',
    bg: '#282a36',
    surface: '#1e1f29',
    border: 'rgba(98,114,164,0.3)',
    text: '#f8f8f2',
    textMuted: '#6272a4',
    accent: '#bd93f9',
    accentBg: 'rgba(189,147,249,0.12)',
    userBubble: 'rgba(255,121,198,0.12)',
    userBubbleBorder: 'rgba(255,121,198,0.3)',
    fontFamily: '"JetBrains Mono", monospace',
  },
  {
    id: 'nord',
    name: 'Nord',
    emoji: '🏔️',
    bg: '#2e3440',
    surface: '#3b4252',
    border: 'rgba(136,192,208,0.2)',
    text: '#eceff4',
    textMuted: '#4c566a',
    accent: '#88c0d0',
    accentBg: 'rgba(136,192,208,0.12)',
    userBubble: 'rgba(129,161,193,0.15)',
    userBubbleBorder: 'rgba(129,161,193,0.3)',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    emoji: '🐱',
    bg: '#1e1e2e',
    surface: '#181825',
    border: 'rgba(203,166,247,0.15)',
    text: '#cdd6f4',
    textMuted: '#585b70',
    accent: '#cba6f7',
    accentBg: 'rgba(203,166,247,0.12)',
    userBubble: 'rgba(137,180,250,0.12)',
    userBubbleBorder: 'rgba(137,180,250,0.25)',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  },
  {
    id: 'solarized',
    name: 'Solarized',
    emoji: '☀️',
    bg: '#002b36',
    surface: '#073642',
    border: 'rgba(0,43,54,0.5)',
    text: '#839496',
    textMuted: '#586e75',
    accent: '#268bd2',
    accentBg: 'rgba(38,139,210,0.12)',
    userBubble: 'rgba(42,161,152,0.12)',
    userBubbleBorder: 'rgba(42,161,152,0.3)',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  },
  {
    id: 'monokai',
    name: 'Monokai',
    emoji: '🎨',
    bg: '#272822',
    surface: '#1e1f1c',
    border: 'rgba(117,113,94,0.2)',
    text: '#f8f8f2',
    textMuted: '#75715e',
    accent: '#a6e22e',
    accentBg: 'rgba(166,226,46,0.1)',
    userBubble: 'rgba(249,38,114,0.1)',
    userBubbleBorder: 'rgba(249,38,114,0.25)',
    fontFamily: '"Fira Code", monospace',
  },
];

const THEME_KEY = 'jarvis_theme';

// Apply theme to document
export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--surface', theme.surface);
  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--text-muted', theme.textMuted);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-bg', theme.accentBg);
  root.style.setProperty('--user-bubble', theme.userBubble);
  root.style.setProperty('--user-bubble-border', theme.userBubbleBorder);
  root.style.setProperty('--font', theme.fontFamily);
  document.body.style.background = theme.bg;
  document.body.style.color = theme.text;
  document.body.style.fontFamily = theme.fontFamily;
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return THEMES[0];
  try {
    const id = localStorage.getItem(THEME_KEY) || 'default';
    return THEMES.find(t => t.id === id) || THEMES[0];
  } catch {
    return THEMES[0];
  }
}

export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(THEME_KEY, theme.id); } catch {}
  applyTheme(theme);
}

// Init on page load
export function initTheme() {
  applyTheme(getStoredTheme());
}
