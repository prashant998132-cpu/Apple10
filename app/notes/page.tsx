'use client';
import { useState, useEffect } from 'react';

interface Note {
  id: number;
  text: string;
  category: string;
  pinned: boolean;
  ts: number;
  color: string;
}

const CATEGORIES = [
  { id: 'all', label: '📋 All', color: '#6366f1' },
  { id: 'personal', label: '👤 Personal', color: '#22d3ee' },
  { id: 'work', label: '💼 Work', color: '#fbbf24' },
  { id: 'idea', label: '💡 Idea', color: '#a78bfa' },
  { id: 'todo', label: '✅ Todo', color: '#22c55e' },
  { id: 'important', label: '⚡ Important', color: '#f87171' },
];

const COLORS = ['#1e293b', '#1a1a2e', '#0f2027', '#1c1c1c', '#0d1117'];

function loadNotes(): Note[] {
  try {
    const manual: Note[] = JSON.parse(localStorage.getItem('jarvis_notes') || '[]');
    // Also load notes saved from chat (MessageBubble 📌 button)
    const fromChat = JSON.parse(localStorage.getItem('jarvis_saved_notes') || '[]');
    const chatNotes: Note[] = fromChat.map((n: any) => ({
      id: n.id,
      text: n.content || n.text || '',
      category: 'idea',
      pinned: false,
      ts: n.ts || n.id,
      color: '#0f2027',
    }));
    // Merge, deduplicate by id, manual first
    const allIds = new Set(manual.map(n => n.id));
    const merged = [...manual, ...chatNotes.filter(n => !allIds.has(n.id))];
    return merged.sort((a, b) => b.ts - a.ts);
  }
  catch { return []; }
}
function saveNotes(n: Note[]) {
  // Only save manual notes (not chat-sourced ones which are in jarvis_saved_notes)
  try {
    const manual = n.filter(note => note.color !== '#0f2027' || note.category !== 'idea');
    // Keep all non-chat notes + any manually edited ones
    localStorage.setItem('jarvis_notes', JSON.stringify(n));
  } catch {}
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('personal');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Note | null>(null);

  useEffect(() => { setNotes(loadNotes()); }, []);

  const save = () => {
    if (!input.trim()) return;
    if (editing) {
      const updated = notes.map(n => n.id === editing.id ? { ...n, text: input, category } : n);
      setNotes(updated); saveNotes(updated);
      setEditing(null);
    } else {
      const note: Note = { id: Date.now(), text: input.trim(), category, pinned: false, ts: Date.now(), color: COLORS[Math.floor(Math.random() * COLORS.length)] };
      const updated = [note, ...notes];
      setNotes(updated); saveNotes(updated);
    }
    setInput('');
  };

  const toggle = (id: number, field: 'pinned') => {
    const updated = notes.map(n => n.id === id ? { ...n, [field]: !n[field] } : n);
    setNotes(updated); saveNotes(updated);
  };

  const del = (id: number) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated); saveNotes(updated);
  };

  const shareWA = (text: string) => {
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  };

  const startEdit = (note: Note) => {
    setEditing(note);
    setInput(note.text);
    setCategory(note.category);
  };

  const filtered = notes
    .filter(n => filter === 'all' || n.category === filter)
    .filter(n => !search || n.text.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.ts - a.ts);

  const catColor = (id: string) => CATEGORIES.find(c => c.id === id)?.color || '#6366f1';

  return (
    <div style={{ minHeight: '100dvh', background: '#070810', color: '#e2e8f0', fontFamily: 'sans-serif', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#0a0c14', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#a78bfa' }}>📝 Quick Notes</div>
        <div style={{ fontSize: 11, color: '#374151' }}>{notes.length} notes</div>
      </div>

      <div style={{ padding: 14 }}>
        {/* Input */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Note likho..."
            rows={3}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 14, resize: 'none', lineHeight: 1.6 }}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) save(); }}
          />
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                style={{ padding: '3px 10px', borderRadius: 99, border: '1px solid', fontSize: 10, cursor: 'pointer',
                  borderColor: category === cat.id ? cat.color : 'rgba(255,255,255,0.07)',
                  background: category === cat.id ? cat.color + '20' : 'transparent',
                  color: category === cat.id ? cat.color : '#475569' }}>
                {cat.label}
              </button>
            ))}
          </div>
          <button onClick={save} disabled={!input.trim()}
            style={{ width: '100%', padding: '10px', background: input.trim() ? 'linear-gradient(135deg,#a78bfa,#6366f1)' : 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 10, color: input.trim() ? '#fff' : '#374151', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            {editing ? '✏️ Update Note' : '+ Save Note (Ctrl+Enter)'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setInput(''); }}
              style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
              Cancel
            </button>
          )}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Notes search karo..."
          style={{ width: '100%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setFilter(cat.id)}
              style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 99, border: '1px solid', fontSize: 10, cursor: 'pointer', fontWeight: 700,
                borderColor: filter === cat.id ? cat.color : 'rgba(255,255,255,0.07)',
                background: filter === cat.id ? cat.color + '20' : 'transparent',
                color: filter === cat.id ? cat.color : '#6b7280' }}>
              {cat.label} {cat.id !== 'all' ? `(${notes.filter(n => n.category === cat.id).length})` : `(${notes.length})`}
            </button>
          ))}
        </div>

        {/* Notes grid */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#374151' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
            <div>Koi note nahi — likho kuch!</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filtered.map(note => (
            <div key={note.id}
              style={{ background: note.color, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px', position: 'relative',
                borderColor: note.pinned ? catColor(note.category) : 'rgba(255,255,255,0.07)' }}>
              {/* Pinned indicator */}
              {note.pinned && (
                <div style={{ position: 'absolute', top: -6, right: 10, fontSize: 14 }}>📌</div>
              )}
              {/* Category badge */}
              <div style={{ fontSize: 9, color: catColor(note.category), fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
                {CATEGORIES.find(c => c.id === note.category)?.label || note.category}
              </div>
              {/* Text */}
              <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.5, marginBottom: 10, wordBreak: 'break-word' }}>
                {note.text}
              </div>
              {/* Time */}
              <div style={{ fontSize: 9, color: '#374151', marginBottom: 8 }}>
                {new Date(note.ts).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })}
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => toggle(note.id, 'pinned')}
                  style={{ flex: 1, padding: '4px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: note.pinned ? '#fbbf24' : '#475569', fontSize: 11, cursor: 'pointer' }}>
                  {note.pinned ? '📌' : '📍'}
                </button>
                <button onClick={() => startEdit(note)}
                  style={{ flex: 1, padding: '4px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#6b7280', fontSize: 11, cursor: 'pointer' }}>
                  ✏️
                </button>
                <button onClick={() => shareWA(note.text)}
                  style={{ flex: 1, padding: '4px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#22c55e', fontSize: 11, cursor: 'pointer' }}>
                  💬
                </button>
                <button onClick={() => del(note.id)}
                  style={{ flex: 1, padding: '4px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
