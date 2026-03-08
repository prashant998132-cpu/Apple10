'use client';
import { useRef, useState, useEffect } from 'react';

interface Props {
  value: string; onChange: (v: string) => void;
  onSend: (text?: string) => void; loading: boolean;
  onStop: () => void; onCompress: () => void;
  currentMode?: string; onModeChange?: (mode: string) => void;
}

const MODES = [
  { id: 'flash', icon: '⚡', label: 'Flash', desc: 'Fast' },
  { id: 'think', icon: '🧠', label: 'Think', desc: 'Reason' },
  { id: 'deep',  icon: '🔬', label: 'Deep',  desc: 'Tools' },
  { id: 'auto',  icon: '🤖', label: 'Auto',  desc: 'Smart' },
];

const ATTACH = [
  { id: 'camera',  icon: '📷', label: 'Camera',     accept: 'image/*', capture: 'environment' },
  { id: 'image',   icon: '🖼️', label: 'Image',      accept: 'image/*', capture: undefined },
  { id: 'pdf',     icon: '📄', label: 'PDF',        accept: 'application/pdf', capture: undefined },
  { id: 'voice',   icon: '🎵', label: 'Voice note', accept: 'audio/*', capture: undefined },
];

export default function InputBar({ value, onChange, onSend, loading, onStop, onCompress, currentMode = 'flash', onModeChange }: Props) {
  const [listening, setListening] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  // Close popup on outside click
  useEffect(() => {
    if (!showPopup) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setShowPopup(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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

  const handleAttach = (item: typeof ATTACH[0]) => {
    setShowPopup(false);
    if (item.id === 'voice') { startVoice(); return; }
    document.getElementById(`inp-${item.id}`)?.click();
  };

  return (
    <div className="px-3 pb-3 pt-1 relative">

      {/* Hidden file inputs */}
      {ATTACH.filter(a => a.id !== 'voice').map(a => (
        <input key={a.id} id={`inp-${a.id}`} type="file"
          className="hidden" accept={a.accept}
          {...(a.capture ? { capture: a.capture as any } : {})} />
      ))}

      {/* ── POPUP ── */}
      {showPopup && (
        <div ref={popupRef}
          className="absolute bottom-full left-3 mb-2 z-50 bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
          style={{ minWidth: '180px' }}>

          {/* MODE section */}
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-bold text-gray-500 tracking-widest mb-2 uppercase">Mode</p>
            {MODES.map(m => (
              <button key={m.id}
                onClick={() => { onModeChange?.(m.id); setShowPopup(false); }}
                className={`flex items-center gap-3 w-full px-2 py-2 rounded-xl mb-0.5 transition-colors ${
                  currentMode === m.id ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-800/60'
                }`}>
                <span className="text-lg w-6 text-center">{m.icon}</span>
                <span className="text-sm font-medium flex-1 text-left">{m.label}</span>
                <span className="text-[10px] text-gray-600">{m.desc}</span>
                {currentMode === m.id && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1" />}
              </button>
            ))}
          </div>

          <div className="mx-3 border-t border-gray-800/80 my-1" />

          {/* ATTACH section */}
          <div className="px-3 pb-3">
            <p className="text-[10px] font-bold text-gray-500 tracking-widest mb-2 mt-1 uppercase">Attach</p>
            {ATTACH.map(a => (
              <button key={a.id}
                onClick={() => handleAttach(a)}
                className="flex items-center gap-3 w-full px-2 py-2 rounded-xl mb-0.5 text-gray-300 hover:bg-gray-800/60 transition-colors">
                <span className="text-lg w-6 text-center">{a.icon}</span>
                <span className="text-sm font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── INPUT ROW ── */}
      <div className="flex items-end gap-2 bg-gray-900/80 border border-gray-800 rounded-2xl px-3 py-2">
        {/* + button */}
        <button
          onClick={() => setShowPopup(s => !s)}
          className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
            showPopup ? 'bg-blue-600 text-white rotate-45' : 'text-gray-500 hover:text-blue-400'
          }`}
          style={{ fontSize: '20px', fontWeight: 300 }}>
          +
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef} value={value}
          onChange={e => { onChange(e.target.value); if (showPopup) setShowPopup(false); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Type karo..."
          className="flex-1 bg-transparent text-gray-100 placeholder-gray-600 resize-none outline-none text-sm leading-5"
          style={{ minHeight: '24px', maxHeight: '120px' }} rows={1} />

        {/* Mic */}
        <button onClick={startVoice}
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all text-base ${
            listening ? 'bg-red-500 animate-pulse text-white' : 'text-gray-500 hover:text-blue-400'
          }`}>
          🎤
        </button>

        {/* Send / Stop */}
        {loading ? (
          <button onClick={onStop}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500/90 flex items-center justify-center text-white text-xs">
            ⏹
          </button>
        ) : (
          <button onClick={() => onSend()} disabled={!value.trim()}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 disabled:bg-gray-800 flex items-center justify-center text-white text-sm font-bold transition-colors">
            ↑
          </button>
        )}
      </div>
    </div>
  );
}
