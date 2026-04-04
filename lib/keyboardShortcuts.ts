'use client';

// ══════════════════════════════════════════════════════════════
// JARVIS Keyboard Shortcuts — Desktop power user support
// ══════════════════════════════════════════════════════════════

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

let shortcuts: Shortcut[] = [];
let initialized = false;

function matchesShortcut(e: KeyboardEvent, s: Shortcut): boolean {
  const key = e.key.toLowerCase() === s.key.toLowerCase();
  const ctrl  = !!s.ctrl  === (e.ctrlKey  || e.metaKey);
  const shift = !!s.shift === e.shiftKey;
  const alt   = !!s.alt   === e.altKey;
  return key && ctrl && shift && alt;
}

export function initKeyboardShortcuts(newShortcuts: Shortcut[]) {
  shortcuts = newShortcuts;
  if (initialized) return;
  initialized = true;

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // Skip if typing in input
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    for (const s of shortcuts) {
      if (matchesShortcut(e, s)) {
        e.preventDefault();
        s.action();
        return;
      }
    }
  });
}

export function getShortcuts(): Shortcut[] { return shortcuts; }

// Default JARVIS shortcuts
export function getDefaultShortcuts(handlers: {
  focusInput?: () => void;
  clearChat?: () => void;
  newChat?: () => void;
  toggleThink?: () => void;
  navigate?: (path: string) => void;
}): Shortcut[] {
  return [
    { key: '/', description: 'Focus chat input', action: () => handlers.focusInput?.() },
    { key: 'k', ctrl: true, description: 'Focus chat input', action: () => handlers.focusInput?.() },
    { key: 'l', ctrl: true, description: 'Clear chat', action: () => handlers.clearChat?.() },
    { key: 'n', ctrl: true, description: 'New chat', action: () => handlers.newChat?.() },
    { key: 't', ctrl: true, description: 'Toggle think mode', action: () => handlers.toggleThink?.() },
    { key: '1', alt: true, description: 'Go to Home', action: () => handlers.navigate?.('/') },
    { key: '2', alt: true, description: 'Go to Dashboard', action: () => handlers.navigate?.('/dashboard') },
    { key: '3', alt: true, description: 'Go to Notes', action: () => handlers.navigate?.('/notes') },
    { key: '4', alt: true, description: 'Go to Settings', action: () => handlers.navigate?.('/settings') },
  ];
}
