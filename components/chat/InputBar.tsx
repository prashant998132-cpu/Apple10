'use client';
import { useRef, useState, useEffect } from 'react';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import Link from 'next/link';

interface Props {
  value: string; onChange: (v: string) => void;
  onSend: (text?: string) => void; loading: boolean;
  onStop: () => void; onCompress: () => void;
  currentMode?: string; onModeChange?: (mode: string) => void;
  sessionId?: string; onSessionSelect?: (id: string) => void;
  toolsRunning?: boolean; puterReady?: boolean;
}

const MODES = [
  { id: 'flash', icon: '⚡', label: 'Flash', desc: 'Fast' },
  { id: 'think', icon: '🧠', label: 'Think', desc: 'Reason' },
  { id: 'deep',  icon: '🔬', label: 'Deep',  desc: 'Tools' },
  { id: 'auto',  icon: '🤖', label: 'Auto',  desc: 'Smart' },
];
const ATTACH = [
  { id: 'camera', icon: '📷', label: 'Camera',     accept: 'image/*', capture: 'environment' },
  { id: 'image',  icon: '🖼️', label: 'Image',      accept: 'image/*' },
  { id: 'pdf',    icon: '📄', label: 'PDF',        accept: 'application/pdf' },
  { id: 'voice',  icon: '🎵', label: 'Voice note', accept: 'audio/*' },
];

export default function InputBar({
  value, onChange, onSend, loading, onStop, onCompress,
  currentMode = 'flash', onModeChange,
  sessionId = '', onSessionSelect,
  toolsRunning, puterReady
}: Props) {
  const [listening, setListening] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = textareaRef.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [value]);

  useEffect(() => {
    if (!showPopup) return;
    const h = (e: MouseEvent) => { if (popupRef.current && !popupRef.current.contains(e.target as Node)) setShowPopup(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showPopup]);

  const startVoice = () => {
    setShowPopup(false);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'hi-IN'; rec.continuous = false; rec.interimResults = true;
    rec.onresult = (e: any) => onChange(Array.from(e.results).map((r: any) => r[0].transcript).join(''));
    rec.onend = () => { setListening(false); setTimeout(() => onSend(), 300); };
    rec.onerror = () => setListening(false);
    rec.start(); setListening(true);
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  };

  const modeIcon = MODES.find(m => m.id === currentMode)?.icon || '⚡';

  return (
    <div className="relative w-full">
      {/* Hidden file inputs */}
      {ATTACH.filter(a => a.id !== 'voice').map(a => (
        <input key={a.id} id={`inp-${a.id}`} type="file" className="hidden" accept={a.accept}
          {...(a.capture ? { capture: a.capture as any } : {})} />
      ))}

      {/* ── POPUP ── */}
      {showPopup && (
        <div ref={popupRef}
          className="absolute bottom-full left-0 mb-2 z-50 bg-[#161b26] border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden"
          style={{ minWidth: '190px', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* MODE */}
          <div className="px-2 pt-2">
            <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase mb-1 px-1">Mode</p>
            {MODES.map(m => (
              <button key={m.id}
                onClick={() => { onModeChange?.(m.id); setShowPopup(false); if (navigator.vibrate) navigator.vibrate(20); }}
                className={`flex items-center gap-2 w-full px-2 py-2 rounded-xl mb-0.5 transition-all ${
                  currentMode === m.id ? 'bg-blue-600/25 text-blue-300' : 'text-gray-300 hover:bg-gray-800/60'
                }`}>
                <span className="text-lg w-6 text-center leading-none">{m.icon}</span>
                <span className="text-sm font-medium flex-1 text-left">{m.label}</span>
                {currentMode === m.id && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
          <div className="mx-2 my-1.5 border-t border-gray-800" />
          {/* ATTACH */}
          <div className="px-2 pb-2">
            <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase mb-1 px-1">Attach</p>
            {ATTACH.map(a => (
              <button key={a.id}
                onClick={() => {
                  setShowPopup(false);
                  if (a.id === 'voice') { startVoice(); return; }
                  document.getElementById(`inp-${a.id}`)?.click();
                }}
                className="flex items-center gap-2 w-full px-2 py-2 rounded-xl mb-0.5 text-gray-300 hover:bg-gray-800/60 transition-all">
                <span className="text-lg w-6 text-center leading-none">{a.icon}</span>
                <span className="text-sm font-medium">{a.label}</span>
              </button>
            ))}
          </div>

        </div>
      )}

      {/* ── TOP ROW: history + status (tiny, above input) ── */}
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-1">
          {onSessionSelect && (
            <ChatHistorySidebar onSelect={onSessionSelect} currentSession={sessionId} />
          )}
          {toolsRunning && <span className="text-[10px] text-yellow-400 animate-pulse">🔧</span>}
          {puterReady && <span className="text-[9px] text-green-600">⚡</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCompress} className="text-[13px] text-gray-600 hover:text-gray-400 transition-colors">✂️</button>
          <Link href="/settings" className="text-[13px] text-gray-600 hover:text-gray-400 transition-colors">⚙️</Link>
        </div>
      </div>

      {/* ── MAIN INPUT BOX ── */}
      <div className="flex flex-col bg-[#1c1f2e] border border-gray-700/60 rounded-2xl overflow-hidden shadow-lg transition-all focus-within:border-gray-600">
        <textarea
          ref={textareaRef} value={value}
          onChange={e => { onChange(e.target.value); if (showPopup) setShowPopup(false); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Message karo..."
          className="w-full bg-transparent text-gray-100 placeholder-gray-600 resize-none outline-none text-sm leading-6 px-4 pt-3.5 pb-2"
          style={{ minHeight: '50px', maxHeight: '200px' }} rows={1} />

        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPopup(s => !s)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm transition-all ${
                showPopup ? 'bg-blue-600/30 text-blue-300' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/50'
              }`}>
              <span className={`transition-transform duration-200 ${showPopup ? 'rotate-45' : ''}`} style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
            </button>
            <button onClick={() => setShowPopup(s => !s)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700/40 transition-colors">
              <span>{modeIcon}</span>
              <span className="text-[11px] capitalize">{currentMode}</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={startVoice}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all text-base ${
                listening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-600 hover:text-gray-300 hover:bg-gray-700/50'
              }`}>🎤</button>
            {loading ? (
              <button onClick={onStop}
                className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm hover:bg-white/20 transition-colors">
                ⏹
              </button>
            ) : (
              <button onClick={() => onSend()} disabled={!value.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all disabled:opacity-30 bg-white text-black hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-500">
                ↑
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
