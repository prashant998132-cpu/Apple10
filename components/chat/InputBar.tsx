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
  onAppCommand?: (action: string, payload: any) => void;
  wakeWordEnabled?: boolean;
  voiceLoopActive?: boolean;
}

const MODES = [
  { id: 'flash', icon: '⚡', label: 'Flash',  desc: 'Fastest',   color: '#facc15' },
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

  const startWakeListener = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'hi-IN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(' ').toLowerCase();
      if (containsWakeWord(transcript)) {
        if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
        rec.stop(); setWakeActive(false);
        setTimeout(() => startVoice(), 300);
      }
    };
    rec.onend = () => { if (wakeWordEnabled && wakeRecRef.current) { try { rec.start(); } catch {} } };
    rec.onerror = () => { setWakeActive(false); wakeRecRef.current = null; };
    wakeRecRef.current = rec; setWakeActive(true);
    try { rec.start(); } catch {}
  }, [wakeWordEnabled]);

  useEffect(() => {
    if (wakeWordEnabled) { startWakeListener(); }
    else {
      if (wakeRecRef.current) { try { wakeRecRef.current.stop(); } catch {} wakeRecRef.current = null; }
      setWakeActive(false);
    }
    return () => { if (wakeRecRef.current) { try { wakeRecRef.current.stop(); } catch {} wakeRecRef.current = null; } };
  }, [wakeWordEnabled, startWakeListener]);

  const handleVoiceResult = useCallback((transcript: string) => {
    const cmd = detectVoiceCommand(transcript);
    if (cmd.type === 'deeplink' && cmd.payload?.url) { onChange(transcript); setTimeout(() => { executeDeepLink(cmd.payload.url); onChange(''); }, 500); return; }
    if (cmd.type === 'appcontrol') { onAppCommand?.(cmd.action, cmd.payload); onChange(''); return; }
    onChange(transcript);
    setTimeout(() => (document.querySelector('textarea') as HTMLTextAreaElement)?.focus(), 100);
  }, [onChange, onAppCommand]);

  const startVoice = () => {
    setShowPopup(false);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = 'hi-IN'; rec.continuous = false; rec.interimResults = true; rec.maxAlternatives = 2;
      let finalTranscript = '';
      rec.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        onChange(finalTranscript || interim);
      };
      rec.onend = () => {
        setListening(false);
        const text = finalTranscript.trim() || value.trim();
        if (!text || text.length < 2) {
          const rec2 = new SR();
          rec2.lang = 'en-IN'; rec2.continuous = false; rec2.interimResults = false;
          rec2.onresult = (e2: any) => { const t = Array.from(e2.results).map((r: any) => r[0].transcript).join(''); onChange(t); };
          rec2.onend = () => { const t2 = textareaRef.current?.value?.trim() || value.trim(); if (t2) handleVoiceResult(t2); };
          rec2.onerror = () => {};
          try { rec2.start(); } catch {}
          return;
        }
        if (text) handleVoiceResult(text);
      };
      rec.onerror = () => setListening(false);
      rec.start(); setListening(true);
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    }
  };

  const handleVisionFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64 = (ev.target?.result as string).split(',')[1];
      const mime = file.type;
      onChange(`📎 ${file.name}`);
      try {
        const r = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: b64, mimeType: mime, prompt: 'Yeh image/document mein kya hai? Detail mein batao.' }),
        });
        const d = await r.json();
        if (d.text) { onChange(''); onVisionResult?.(`📷 **Image Analysis:**\n\n${d.text}`); }
        else { onChange(''); onVisionResult?.('📷 Image analyze nahi ho payi. Dobara try karo.'); }
      } catch { onChange(''); onVisionResult?.('📷 Image analyze nahi ho payi. Dobara try karo.'); }
    };
    reader.readAsDataURL(file);
  };

  const currentModeObj = MODES.find(m => m.id === currentMode) || MODES[3];
  const hasText = value.trim().length > 0;

  // ── Inline styles ──────────────────────────────────────────
  const S = {
    wrap: { position: 'relative' as const, width: '100%' },
    wakeBar: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', marginBottom: 4, borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: 12 },
    popup: { position: 'absolute' as const, bottom: '100%', left: 0, marginBottom: 8, zIndex: 50, borderRadius: 18, overflow: 'hidden', minWidth: 185, maxHeight: '72vh', overflowY: 'auto' as const, background: '#13161f', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' },
    popLabel: { fontSize: 9, fontWeight: 700, color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 6, padding: '0 6px' },
    modeBtn: (active: boolean, color: string) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px', borderRadius: 12, marginBottom: 2, textAlign: 'left' as const, cursor: 'pointer', border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent', background: active ? 'rgba(255,255,255,0.07)' : 'transparent', color: active ? color : '#d1d5db', fontSize: 13, fontWeight: 500 }),
    attachBtn: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px', borderRadius: 12, marginBottom: 2, cursor: 'pointer', border: '1px solid transparent', background: 'transparent', color: '#9ca3af', fontSize: 13, textAlign: 'left' as const },
    box: { display: 'flex', flexDirection: 'column' as const, borderRadius: 18, overflow: 'hidden', background: '#141720', border: '1px solid rgba(255,255,255,0.09)' },
    textarea: { width: '100%', background: 'transparent', color: '#f1f5f9', resize: 'none' as const, outline: 'none', border: 'none', fontSize: 14, lineHeight: '24px', padding: '14px 16px 8px', minHeight: 52, maxHeight: 180, fontFamily: 'inherit' },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 10px', gap: 8 },
    leftRow: { display: 'flex', alignItems: 'center', gap: 6 },
    rightRow: { display: 'flex', alignItems: 'center', gap: 6 },
    plusBtn: (open: boolean) => ({ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)', background: open ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: open ? '#60a5fa' : '#6b7280', fontSize: 20, fontWeight: 300, transform: open ? 'rotate(45deg)' : 'none', transition: 'all 0.2s' }),
    modePill: (color: string) => ({ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color, fontSize: 11, fontWeight: 600, cursor: 'pointer' }),
    compressBtn: { width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#4b5563', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    micBtn: (active: boolean) => ({ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `1px solid ${active ? '#ef4444' : 'rgba(255,255,255,0.07)'}`, background: active ? '#ef4444' : 'rgba(255,255,255,0.04)', color: active ? 'white' : '#6b7280', fontSize: 15 }),
    sendBtn: (active: boolean) => ({ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: active ? 'pointer' : 'default', border: 'none', background: active ? '#ffffff' : 'rgba(255,255,255,0.07)', color: active ? '#0a0b0f' : '#374151', fontSize: 14, fontWeight: 700, transform: active ? 'scale(1)' : 'scale(0.95)', transition: 'all 0.15s' }),
  };

  return (
    <div style={S.wrap}>
      {/* HIDDEN file inputs — inline display:none, no Tailwind */}
      {ATTACH.filter(a => a.id !== 'voice').map(a => (
        <input
          key={a.id} id={`inp-${a.id}`} type="file"
          style={{ display: 'none' }}
          accept={a.accept}
          {...(a.capture ? { capture: a.capture as any } : {})}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && (a.id === 'camera' || a.id === 'image') && onVisionResult) handleVisionFile(file);
            e.target.value = '';
          }}
        />
      ))}

      {/* Wake word indicator */}
      {wakeActive && (
        <div style={S.wakeBar}>
          <span>🎙</span>
          <span>Hey JARVIS sun raha hoon...</span>
        </div>
      )}

      {/* POPUP */}
      {showPopup && (
        <div ref={popupRef} style={S.popup}>
          <div style={{ padding: '10px 8px 6px' }}>
            <p style={S.popLabel}>Mode</p>
            {MODES.map(m => (
              <button key={m.id}
                onClick={() => { onModeChange?.(m.id); setShowPopup(false); if (navigator.vibrate) navigator.vibrate(15); }}
                style={S.modeBtn(currentMode === m.id, m.color)}>
                <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{m.icon}</span>
                <span style={{ flex: 1 }}>{m.label}</span>
                <span style={{ fontSize: 10, color: '#6b7280' }}>{m.desc}</span>
                {currentMode === m.id && <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0 }} />}
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 8px' }} />
          <div style={{ padding: '6px 8px 10px' }}>
            <p style={S.popLabel}>Attach</p>
            {ATTACH.map(a => (
              <button key={a.id}
                onClick={() => { setShowPopup(false); if (a.id === 'voice') { startVoice(); return; } document.getElementById(`inp-${a.id}`)?.click(); }}
                style={S.attachBtn}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN INPUT BOX */}
      <div style={S.box}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { onChange(e.target.value); if (showPopup) setShowPopup(false); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Message karo..."
          style={S.textarea}
          rows={1}
        />

        {/* Bottom row */}
        <div style={S.row}>
          {/* Left: + mode compress */}
          <div style={S.leftRow}>
            <button onClick={() => setShowPopup(s => !s)} style={S.plusBtn(showPopup)}>+</button>
            <button onClick={() => setShowPopup(s => !s)} style={S.modePill(currentModeObj.color)}>
              <span>{currentModeObj.icon}</span>
              <span>{currentModeObj.label}</span>
            </button>
            <button onClick={onCompress} title="Compress" style={S.compressBtn}>✂️</button>
          </div>

          {/* Right: mic + send */}
          <div style={S.rightRow}>
            <button onClick={startVoice} style={S.micBtn(listening)}>🎤</button>
            {loading ? (
              <button onClick={onStop} style={{ ...S.sendBtn(true), background: 'rgba(255,255,255,0.08)', color: 'white' }}>⏹</button>
            ) : (
              <button onClick={() => onSend()} disabled={!hasText} style={S.sendBtn(hasText)}>↑</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
