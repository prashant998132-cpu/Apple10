'use client';
export interface Shortcut { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean; description: string; action: () => void; }

let _shortcuts: Shortcut[] = [];
let _initialized = false;

function matches(e: KeyboardEvent, s: Shortcut): boolean {
  return e.key.toLowerCase() === s.key.toLowerCase() &&
    (!!s.ctrl === (e.ctrlKey || e.metaKey)) &&
    (!!s.shift === e.shiftKey) &&
    (!!s.alt === e.altKey);
}

export function initKeyboardShortcuts(shortcuts: Shortcut[]) {
  _shortcuts = shortcuts;
  if (_initialized) return;
  _initialized = true;
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    for (const s of _shortcuts) { if (matches(e, s)) { e.preventDefault(); s.action(); return; } }
  });
}

export function getDefaultShortcuts(h: { focusInput?: () => void; newChat?: () => void; navigate?: (p: string) => void }): Shortcut[] {
  return [
    { key: '/', description: 'Focus input', action: () => h.focusInput?.() },
    { key: 'k', ctrl: true, description: 'Focus input', action: () => h.focusInput?.() },
    { key: 'n', ctrl: true, description: 'New chat', action: () => h.newChat?.() },
    { key: '1', alt: true, description: 'Home', action: () => h.navigate?.('/') },
    { key: '2', alt: true, description: 'Dashboard', action: () => h.navigate?.('/dashboard') },
    { key: '3', alt: true, description: 'Notes', action: () => h.navigate?.('/notes') },
    { key: '4', alt: true, description: 'Settings', action: () => h.navigate?.('/settings') },
    { key: '5', alt: true, description: 'Quiz', action: () => h.navigate?.('/quiz') },
  ];
}
