'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { detectVoiceCommand, containsWakeWord, executeDeepLink } from '@/lib/voiceCommands';

interface Props {
  value: string; onChange: (v: string) => void;
  onSend: (text?: string) => void; loading: boolean;
  onStop: () => void; onCompress: () => void;
  currentMode?: string; onModeChange?: (mode: string) => void;
  sessionId?: string; onSessionSelect?: (id: string) => void;
  toolsRunning?: boolean; puterReady?: boolean;
  onVisionResult?: (result: string) => void;
  onAppCommand?: (action: string, payload: any) => void; // App control callback
  wakeWordEnabled?: boolean;
}

const MODES = [
  { id: 'flash', icon: '⚡', label: 'Flash',  desc: 'Fastest',  color: '#facc15' },
  { id: 'think', icon: '🧠', label: 'Think',  desc: 'Reasoning', color: '#a78bfa' },
  { id: 'deep',  icon: '🔬', label: 'Deep',   desc: 'Analysis',  color: '#34d399' },
  { id: 'auto',  icon: '🤖', label: 'Auto',   desc: 'Smart',     color: '#60a5fa' },
];
const ATTACH = [
  { id: 'camera', icon: '📷', label: 'Camera',     accept: 'image/*', capture: 'environment' },
  { id: 'image',  icon: '🖼️', label: 'Image',      accept: 'image/*' },
  { id: 'pdf',    icon: '📄', label: 'PDF',        accept: 'application/pdf' },
  { id: 'voice',  icon: '🎵', label: 'Voice note', accept: 'audio/*' },
];

export default function InputBar({
  value, onChange, onSend, loading, onStop, onCompress,
  currentMode = 'auto', onModeChange, onVisionResult, onAppCommand, wakeWordEnabled = false,
}: Props) {
  const [listening, setListening] = useState(false);
  const [wakeActive, setWakeActive] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popupRef    = useRef<HTMLDivElement>(null);
  const wakeRecRef  = useRef<any>(null);

  useEffect(() => {
    const el = textareaRef.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [value]);

  useEffect(() => {
    if (!showPopup) return;
    const h = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setShowPopup(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showPopup]);

  // ── Wake Word Listener ─────────────────────────────────────
  const startWakeListener = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'hi-IN'; // Hindi — also catches "hey jarvis" in Hindi accent
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
        .toLowerCase();
      if (containsWakeWord(transcript)) {
        // Wake word detected!
        if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
        rec.stop();
        setWakeActive(false);
        // Start main voice input after brief pause
        setTimeout(() => startVoice(), 300);
      }
    };
    rec.onend = () => {
      // Auto-restart if wake word still enabled
      if (wakeWordEnabled && wakeRecRef.current) {
        try { rec.start(); } catch {}
      }
    };
    rec.onerror = () => {
      setWakeActive(false);
      wakeRecRef.current = null;
    };
    wakeRecRef.current = rec;
    setWakeActive(true);
    try { rec.start(); } catch {}
  }, [wakeWordEnabled]);

  useEffect(() => {
    if (wakeWordEnabled) {
      startWakeListener();
    } else {
      if (wakeRecRef.current) {
        try { wakeRecRef.current.stop(); } catch {}
        wakeRecRef.current = null;
      }
      setWakeActive(false);
    }
    return () => {
      if (wakeRecRef.current) {
        try { wakeRecRef.current.stop(); } catch {}
        wakeRecRef.current = null;
      }
    };
  }, [wakeWordEnabled, startWakeListener]);

  // ── Voice + Command Routing ────────────────────────────────
  const handleVoiceResult = useCallback((transcript: string) => {
    const cmd = detectVoiceCommand(transcript);
    if (cmd.type === 'deeplink' && cmd.payload?.url) {
      onChange(transcript);
      setTimeout(() => { executeDeepLink(cmd.payload.url); onChange(''); }, 500);
      return;
    }
    if (cmd.type === 'appcontrol') {
      onAppCommand?.(cmd.action, cmd.payload);
      onChange('');
      return;
    }
    // Put in input — user reviews + taps send manually (no galat auto-send)
    onChange(transcript);
    setTimeout(() => (document.querySelector('textarea') as HTMLTextAreaElement)?.focus(), 100);
  }, [onChange, onAppCommand]);

  const startVoice = () => {
    setShowPopup(false);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = 'hi-IN'; rec.continuous = false; rec.interimResults = true;
      rec.onresult = (e: any) => onChange(Array.from(e.results).map((r: any) => r[0].transcript).join(''));
      rec.onend = () => {
        setListening(false);
        // Get final transcript from input value
        const finalText = textareaRef.current?.value?.trim() || value.trim();
        if (finalText) handleVoiceResult(finalText);
      };
      rec.onerror = () => { setListening(false); startWhisperSTT(); };
      rec.start(); setListening(true);
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    } else {
      startWhisperSTT();
    }
  };

  const startWhisperSTT = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      setListening(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const fd = new FormData();
        fd.append('file', blob, 'audio.webm');
        fd.append('model', 'whisper-large-v3-turbo');
        fd.append('language', 'hi');
        try {
          const groqKey = process.env.NEXT_PUBLIC_GROQ_KEY || '';
          // Use our /api/stt endpoint
          const r = await fetch('/api/stt', { method: 'POST', body: fd });
          if (r.ok) { const d = await r.json(); if (d.text) onChange(d.text); }
        } catch {}
        setListening(false);
      };
      recorder.start();
      // Auto stop after 10s
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 10000);
      // Manual stop on next voice button press — store recorder ref
      (window as any)._whisperRecorder = recorder;
    } catch { setListening(false); }
  };


  const handleVisionFile = async (file: File) => {
    if (!file) return;
    onChange('[📷 Analyzing image...]');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const mimeType = file.type || 'image/jpeg';
      const userPrompt = value.replace('[📷 Analyzing image...]', '').trim() || 'Yeh image mein kya hai? Detail mein batao.';
      try {
        const r = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType, prompt: userPrompt }),
        });
        const d = await r.json();
        if (d.text) {
          onChange('');
          onVisionResult?.(`📷 **Image Analysis:**

${d.text}`);
        }
      } catch {
        onChange('');
        onVisionResult?.('📷 Image analyze nahi ho payi. Dobara try karo.');
      }
    };
    reader.readAsDataURL(file);
  };

  const currentModeObj = MODES.find(m => m.id === currentMode) || MODES[3];
  const hasText = value.trim().length > 0;

  return (
    <div className="relative w-full">
      {/* Wake word indicator */}
      {wakeActive && (
        <div className="flex items-center gap-1.5 px-3 py-1 mb-1 rounded-xl text-xs"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
          <span style={{ animation: 'pulse-glow 1.5s ease-in-out infinite' }}>🎙</span>
          <span>Hey JARVIS sun raha hoon...</span>
        </div>
      )}
      {/* Hidden file inputs */}
      {ATTACH.filter(a => a.id !== 'voice').map(a => (
        <input key={a.id} id={`inp-${a.id}`} type="file" className="hidden" accept={a.accept}
          {...(a.capture ? { capture: a.capture as any } : {})}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && (a.id === 'camera' || a.id === 'image') && onVisionResult) {
              handleVisionFile(file);
            }
            e.target.value = '';
          }} />
      ))}

      {/* ── POPUP (mode + attach) ── */}
      {showPopup && (
        <div ref={popupRef}
          className="absolute bottom-full left-0 mb-2 z-50 rounded-2xl overflow-hidden fade-in-fast"
          style={{
            minWidth: '185px', maxHeight: '72vh', overflowY: 'auto',
            background: '#13161f', border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)'
          }}>
          {/* MODE */}
          <div className="px-2 pt-2.5 pb-1">
            <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase mb-1.5 px-1.5">Mode</p>
            {MODES.map(m => (
              <button key={m.id}
                onClick={() => { onModeChange?.(m.id); setShowPopup(false); if (navigator.vibrate) navigator.vibrate(15); }}
                className="flex items-center gap-2.5 w-full px-2 py-2 rounded-xl mb-0.5 transition-all text-left"
                style={{
                  background: currentMode === m.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: `1px solid ${currentMode === m.id ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                }}>
                <span className="text-base w-6 text-center leading-none">{m.icon}</span>
                <span className="text-sm font-medium flex-1" style={{ color: currentMode === m.id ? m.color : '#d1d5db' }}>
                  {m.label}
                </span>
                <span className="text-[10px] text-gray-600">{m.desc}</span>
                {currentMode === m.id && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.color }} />}
              </button>
            ))}
          </div>
          <div className="mx-2 my-1" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          {/* ATTACH */}
          <div className="px-2 pb-2.5">
            <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase mb-1.5 px-1.5">Attach</p>
            {ATTACH.map(a => (
              <button key={a.id}
                onClick={() => {
                  setShowPopup(false);
                  if (a.id === 'voice') { startVoice(); return; }
                  document.getElementById(`inp-${a.id}`)?.click();
                }}
                className="flex items-center gap-2.5 w-full px-2 py-2 rounded-xl mb-0.5 text-gray-400 hover:text-gray-200 transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span className="text-base w-6 text-center leading-none">{a.icon}</span>
                <span className="text-sm font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN INPUT BOX ── */}
      <div className="flex flex-col rounded-2xl overflow-hidden input-glow transition-all"
        style={{
          background: '#141720',
          border: '1px solid rgba(255,255,255,0.09)',
        }}>
        <textarea
          ref={textareaRef} value={value}
          onChange={e => { onChange(e.target.value); if (showPopup) setShowPopup(false); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Message karo..."
          className="w-full bg-transparent text-gray-100 placeholder-gray-600 resize-none outline-none text-sm leading-6 px-4 pt-3.5 pb-2"
          style={{ minHeight: '52px', maxHeight: '180px' }} rows={1} />

        {/* Bottom row */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 gap-2">
          {/* Left: + button + mode pill */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPopup(s => !s)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all text-lg leading-none"
              style={{
                background: showPopup ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: showPopup ? '#60a5fa' : '#6b7280',
                transform: showPopup ? 'rotate(45deg)' : 'none',
                transition: 'transform 0.2s, background 0.15s',
              }}>
              +
            </button>
            <button onClick={() => setShowPopup(s => !s)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all text-xs"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: currentModeObj.color,
              }}>
              <span>{currentModeObj.icon}</span>
              <span className="font-medium">{currentModeObj.label}</span>
            </button>
            {/* Compress button — chhota sa */}
            <button onClick={onCompress}
              title="Compress context"
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#4b5563', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4b5563'; }}>
              ✂️
            </button>
          </div>

          {/* Right: mic + send */}
          <div className="flex items-center gap-1.5">
            <button onClick={startVoice}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all text-base"
              style={{
                background: listening ? '#ef4444' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${listening ? '#ef4444' : 'rgba(255,255,255,0.07)'}`,
                color: listening ? 'white' : '#6b7280',
                animation: listening ? 'pulse-glow 1s ease-in-out infinite' : 'none',
              }}>
              🎤
            </button>

            {loading ? (
              <button onClick={onStop}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all text-sm"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                }}>
                ⏹
              </button>
            ) : (
              <button onClick={() => onSend()} disabled={!hasText}
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-all"
                style={{
                  background: hasText ? 'white' : 'rgba(255,255,255,0.07)',
                  color: hasText ? '#0a0b0f' : '#374151',
                  border: 'none',
                  transform: hasText ? 'scale(1)' : 'scale(0.95)',
                  transition: 'all 0.15s',
                }}>
                ↑
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
