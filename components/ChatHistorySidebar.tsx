'use client';
import { useState, useEffect } from 'react';
import { getDB } from '@/lib/db';

interface Session { id: string; preview: string; ts: number; count: number; }
interface Props { onSelect: (sessionId: string) => void; currentSession: string; }

export default function ChatHistorySidebar({ onSelect, currentSession }: Props) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  const load = async () => {
    const db = getDB(); if (!db) return;
    const all = await db.messages.toArray();
    const map = new Map<string, Session>();
    for (const m of all) {
      if (!map.has(m.sessionId)) map.set(m.sessionId, { id: m.sessionId, preview: '', ts: m.ts, count: 0 });
      const s = map.get(m.sessionId)!;
      s.count++;
      s.ts = Math.max(s.ts, m.ts);
      if (m.role === 'user' && !s.preview) s.preview = m.content.slice(0, 55);
    }
    setSessions([...map.values()].sort((a,b) => b.ts - a.ts).slice(0, 30));
  };

  useEffect(() => { if (open) load(); }, [open]);

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const db = getDB(); if (!db) return;
    await db.messages.where('sessionId').equals(id).delete();
    setSessions(s => s.filter(x => x.id !== id));
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="text-gray-500 hover:text-white text-base transition-colors px-1"
        title="Chat History">
        🕐
      </button>

      {/* SIDEBAR DRAWER — fixed over full screen */}
      {open && (
        <div className="fixed inset-0 z-[999]" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#111318] border-r border-gray-800 flex flex-col shadow-2xl"
            style={{ height: '100%', maxHeight: '100vh' }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-800 flex-shrink-0">
              <span className="font-bold text-sm text-white">🕐 Chat History</span>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-xs">
                ✕
              </button>
            </div>

            {/* New Chat button */}
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
              <button
                onClick={() => { onSelect(`session_${Date.now()}`); setOpen(false); }}
                className="w-full py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors">
                ✏️ New Chat
              </button>
            </div>

            {/* Sessions list — scrollable */}
            <div className="flex-1 overflow-y-auto py-1" style={{ overflowY: 'auto' }}>
              {sessions.length === 0 ? (
                <div className="text-center py-16 text-gray-600 text-sm">
                  <p className="text-3xl mb-3">💬</p>
                  <p>Koi history nahi</p>
                  <p className="text-xs mt-1">Pehli baat karo!</p>
                </div>
              ) : (
                sessions.map(s => (
                  <div key={s.id}
                    className={`group flex items-start gap-2 px-3 py-3 mx-2 rounded-xl mb-0.5 cursor-pointer transition-colors ${
                      s.id === currentSession ? 'bg-blue-600/15 border border-blue-500/20' : 'hover:bg-gray-800/60'
                    }`}
                    onClick={() => { onSelect(s.id); setOpen(false); }}>
                    <span className="text-gray-600 text-sm mt-0.5 flex-shrink-0">💬</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate leading-snug">{s.preview || 'New chat'}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {new Date(s.ts).toLocaleDateString('hi-IN')} · {s.count} msgs
                      </p>
                    </div>
                    <button
                      onClick={e => deleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all text-xs flex-shrink-0">
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer — delete all */}
            <div className="p-3 border-t border-gray-800 flex-shrink-0">
              <button
                onClick={async () => {
                  if (!confirm('Sab history delete karein?')) return;
                  const db = getDB();
                  if (db) { await db.messages.clear(); setSessions([]); }
                }}
                className="w-full py-2 rounded-xl bg-red-500/8 text-red-500/70 text-xs border border-red-500/15 hover:bg-red-500/15 transition-colors">
                🗑️ Sab Delete Karo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
