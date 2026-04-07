'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { detectConversationMode, detectEmotion, detectThinkMode, getSystemPrompt, keywordFallback, PersonalityMode } from '@/lib/intelligence';
import { addXP, updateStreak, getProfile, saveMemory, extractProfileInfo, logEmotion, trackTopic, getRelationshipName } from '@/lib/memory';
import { getLocation, getCachedLocation, formatLocation } from '@/lib/location';
import AchievementToast, { triggerAchievement } from '@/components/AchievementToast';
import { startProactiveEngine, speakText } from '@/lib/proactive';
import { searchMemoryVectors, storeMemoryVector } from '@/lib/vectorMemory';
import { syncMessageToCloud } from '@/lib/supabase';
import { runAutonomousTools, queryNeedsTools, getMorningBriefing } from '@/lib/toolEngine';
import { isAgentIntent, detectVoiceCommand, executeDeepLink } from '@/lib/voiceCommands';
import { getDB } from '@/lib/db';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import ModeBar from './ModeBar';
import ThinkBubble from './ThinkBubble';
import CommandPalette from '@/components/CommandPalette';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import TopBar from '@/components/TopBar';
import HomeScreen from '@/components/HomeScreen';
import JarvisOrb from '@/components/JarvisOrb';
import CompressPopup from '@/components/CompressPopup';
import ToastContainer, { showToast } from '@/components/Toast';
import PWAInstall from '@/components/PWAInstall';
import { generateSessionTitle, quickTitle } from '@/lib/intelligence';
import { trackApiCall } from '@/lib/apiStats';
import { isDuplicateAIRequest, trackVercelCall, getVercelUsage } from '@/lib/smartCache';
import { initAgents, setReminder, parseReminderIntent, queueAgentTask, showNotification } from '@/lib/agentManager';
import { detectAppsForQuery, isAppEnabled } from '@/lib/connectedApps';
import { parseRoutineCommand, getRoutine, saveRoutine, getTodayTargets, saveTargets, formatRoutineForChat, formatTargetsForChat, registerRoutineAlarms, scheduleAlarm } from '@/lib/routineManager';
import { extractAndStoreFacts, getRelevantMemories, getProactiveSuggestion, getMemorySummary } from '@/lib/crossSessionMemory';
import {
  getBattery, watchBattery, formatBattery, watchNetwork, getNetworkQuality, networkQualityToMode,
  requestWakeLock, releaseWakeLock, isWakeLockActive, setupWakeLockPersist,
  setBadge, clearBadge, setupMediaSession, clearMediaSession, setMediaSessionPlayback,
  getDeviceCapabilities, VIBRATE, readClipboard, shareText,
  isContactPickerSupported, pickContactForCall,
} from '@/lib/nativeAPIs';

export interface Message {
  id: string; role: 'user' | 'assistant'; content: string; ts: number;
  mode?: string; type?: 'text' | 'image' | 'tool';
  imageUrl?: string; liked?: boolean; pinned?: boolean; thinking?: string;
  toolsUsed?: string[];
  widget?: { type: string; data: any };
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkMode, setThinkMode] = useState<'auto'|'flash'|'think'|'deep'>('auto');
  const [personality, setPersonality] = useState<PersonalityMode>('default');
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}`);
  const [showCompress, setShowCompress] = useState(false);
  const [relationship, setRelationship] = useState({ name: 'Stranger', icon: '🌱', next: 100 });
  const [pinnedMsgs, setPinnedMsgs] = useState<string[]>([]);
  const puterReady = false;
  const [sessionTitle, setSessionTitle] = useState('Naya Chat');
  const [toolsRunning, setToolsRunning] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [batteryInfo, setBatteryInfo] = useState<string>('');
  const [networkQuality, setNetworkQuality] = useState<'fast'|'medium'|'slow'|'offline'>('fast');
  const [voiceLoopActive, setVoiceLoopActive] = useState(false);
  // NEW: search + userName
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [userName, setUserName] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const execAppCommand = useCallback((action: string, payload: any) => {
    switch (action) {
      case 'navigate':
        if (typeof window !== 'undefined') window.location.href = payload.path;
        showToast(`Navigating to ${payload.path}`, '🚀', 'success');
        break;
      case 'clearChat':
        setMessages([]);
        showToast('Chat saaf ho gaya!', '🧹', 'success');
        break;
      case 'setTheme':
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', payload.theme);
          try { localStorage.setItem('jarvis_theme', payload.theme); } catch {}
        }
        showToast(`${payload.theme === 'dark' ? '🌙' : '☀️'} ${payload.theme} mode on`, '✅', 'success');
        break;
      case 'setMode':
        setThinkMode(payload.mode);
        showToast(`${payload.mode} mode set`, '✅', 'success');
        break;
      case 'openSidebar':
        document.getElementById('jarvis-sidebar')?.classList.remove('hidden');
        break;
      case 'scroll':
        if (payload.to === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
        else bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      default: break;
    }
  }, []);

  // ── Export chat ──────────────────────────────────────
  const exportChat = useCallback(() => {
    const text = messages
      .filter(m => m.id !== 'welcome')
      .map(m => {
        const time = new Date(m.ts).toLocaleString('hi-IN', { timeZone: 'Asia/Kolkata' });
        return `[${time}] ${m.role === 'user' ? '👤 Tum' : '🤖 JARVIS'}:\n${m.content}`;
      })
      .join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis-chat-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Chat export ho gaya!', '📥', 'success');
  }, [messages]);

  // ── Filtered messages for search ────────────────────
  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // ── Regenerate last AI response ─────────────────────
  const regenerateLast = useCallback(async () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    // Remove last assistant message
    setMessages(prev => {
      const idx = [...prev].reverse().findIndex(m => m.role === 'assistant');
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      return prev.filter((_, i) => i !== realIdx);
    });
    await sendMessage(lastUser.content, true);
  }, [messages]);

  useEffect(() => {
    (async () => {
      await updateStreak();
      const p = await getProfile();
      setThinkMode(p.thinkMode || 'auto');
      setPersonality(p.personality as PersonalityMode || 'default');
      setRelationship(getRelationshipName(p.xp || 0));

      // ✅ FIX: naam profile se lo, hardcode nahi
      const profileRaw = typeof window !== 'undefined' ? localStorage.getItem('jarvis_profile') : null;
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const name = profile.name || p.name || 'Bhai';
      setUserName(name);

      const hour = new Date().getHours();
      const greet = hour < 12 ? '🌅 Subah' : hour < 17 ? '☀️ Dopahar' : hour < 21 ? '🌆 Shaam' : '🌙 Raat';
      const rel = getRelationshipName(p.xp || 0);
      const welcomeMsg = `**Namaste ${name}! ${greet} mubarak.** ${rel.icon}\n\nAaj kya plan hai?`;
      setMessages([{ id: 'welcome', role: 'assistant', ts: Date.now(), content: welcomeMsg }]);

      const proactive = getProactiveSuggestion();
      if (proactive) {
        setTimeout(() => {
          setMessages(prev => [...prev, { id: `ps_${Date.now()}`, role: 'assistant', ts: Date.now(), content: proactive }]);
        }, 3000);
      }

      if (hour >= 8 && hour <= 10) {
        const briefingKey = `briefed_${new Date().toDateString()}`;
        if (!localStorage.getItem(briefingKey)) {
          localStorage.setItem(briefingKey, '1');
          setTimeout(async () => {
            const briefing = await getMorningBriefing();
            setMessages(prev => [...prev, { id: `briefing_${Date.now()}`, role: 'assistant', ts: Date.now(), content: `📋 **Aaj ki Morning Briefing:**\n\n${briefing}` }]);
            speakText(`Subah mubarak ${name}! Mausam aur news ready hai.`);
          }, 1500);
        }
      }

      const cachedLoc = getCachedLocation();
      if (!cachedLoc) {
        getLocation().then(loc => {
          if (loc.city && typeof window !== 'undefined') {
            const pr = localStorage.getItem('jarvis_profile');
            const pObj = pr ? JSON.parse(pr) : {};
            pObj.location = formatLocation(loc);
            localStorage.setItem('jarvis_profile', JSON.stringify(pObj));
          }
        }).catch(() => {});
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
        navigator.serviceWorker.ready.then(reg => {
          reg.active?.postMessage({ type: 'REGISTER_PERIODIC_SYNC' });
        }).catch(() => {});
        navigator.serviceWorker.addEventListener('message', (e) => {
          if (e.data?.type === 'QUEUE_FLUSHED') showToast(`${e.data.count} offline messages sent!`, '📡', 'success');
          if (e.data?.type === 'NOTIFICATION_CLICK') {
            const cmd = new URL(e.data.url, window.location.origin).searchParams.get('cmd');
            if (cmd) setInput(cmd);
          }
        });
      }

      watchBattery((info) => {
        setBatteryInfo(formatBattery(info));
        if (info.level < 0.1 && !info.charging) { showToast(`Battery ${Math.round(info.level*100)}% — Charger lagao!`, '🔋', 'warning'); VIBRATE.error(); }
      });

      const netCleanup = watchNetwork((q) => {
        setNetworkQuality(q);
        if (q === 'offline') showToast('Internet nahi hai — offline mode', '📵', 'warning');
        if (q === 'slow') showToast('Slow connection — Flash mode preferred', '🐢', 'info');
      });
      setNetworkQuality(getNetworkQuality());
      clearBadge();
      setupWakeLockPersist();
    })();
  }, []);

  const loadSession = useCallback(async (sid: string) => {
    try {
      const db = await getDB();
      const msgs = await db.messages.where('sessionId').equals(sid).sortBy('ts');
      if (msgs.length > 0) { setMessages(msgs as Message[]); setSessionId(sid); }
    } catch {}
  }, []);

  const handleLike = useCallback((id: string, liked: boolean) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, liked } : m));
  }, []);

  const togglePin = useCallback((id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
  }, []);

  const handleSpeak = useCallback((text: string) => { speakText(text); }, []);

  const handleVisionResult = useCallback((result: string) => {
    setMessages(prev => [...prev, { id: `vis_${Date.now()}`, role: 'user', ts: Date.now(), content: result }]);
  }, []);

  const sendMessage = useCallback(async (text?: string, isRegen = false) => {
    const userText = (text ?? input).trim();
    if (!userText || (loading && !isRegen)) return;
    if (!isRegen) {
      setInput('');
      const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', content: userText, ts: Date.now() };
      setMessages(prev => [...prev, userMsg]);
    }
    setLoading(true);

    const profileRaw = typeof window !== 'undefined' ? localStorage.getItem('jarvis_profile') : null;
    const profile = profileRaw ? JSON.parse(profileRaw) : {};
    const memories = getRelevantMemories(userText, 6);
    const emotion = detectEmotion(userText);
    const mode = detectThinkMode(userText, thinkMode);
    const system = getSystemPrompt(personality, profile, memories, emotion, new Date().getHours());

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const r = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.filter(m => m.id !== 'welcome').slice(-12).map(m => ({ role: m.role, content: m.content })).concat([{ role: 'user', content: userText }]), system, mode }),
        signal: ctrl.signal,
      });
      if (!r.ok || !r.body) throw new Error('Stream failed');
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = ''; let full = '';
      const aiId = `a_${Date.now()}`;
      setMessages(prev => [...prev, { id: aiId, role: 'assistant', content: '', ts: Date.now(), mode }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value);
        const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6); if (d === '[DONE]') break;
          try { const t = JSON.parse(d)?.choices?.[0]?.delta?.content; if (t) { full += t; setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: full } : m)); } } catch {}
        }
      }
      extractAndStoreFacts(userText, full);
      addXP(10);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        const fb = keywordFallback(userText);
        const errMsg = (e?.message || '').includes('fetch') || (e?.message || '').includes('network')
          ? '⚠️ Net slow lag raha hai. Dobara try karo.

' + fb
          : fb;
        setMessages(prev => [...prev, { id: 'err_' + Date.now(), role: 'assistant', content: errMsg, ts: Date.now() }]);
      }
    }
    setLoading(false);
    clearBadge();
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [input, loading, messages, thinkMode, personality]);

  const pinnedList = messages.filter(m => m.pinned);

  return (
    <div className="flex flex-col bg-[#0a0b0f]" style={{ height: '100%', overflow: 'hidden' }}>
      <ToastContainer />
      {showCompress && <CompressPopup onClose={() => setShowCompress(false)} />}

      {/* ── SEARCH BAR ── */}
      {showSearch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: '#0a0b0f', borderBottom: '1px solid rgba(99,102,241,0.2)', padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={searchRef}
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Messages mein dhundho..."
            style={{ flex: 1, background: '#141720', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '8px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none' }}
          />
          <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{searchQuery ? filteredMessages.filter(m => m.id !== 'welcome').length : ''}</span>
          <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}
            style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, color: '#9ca3af', padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto" style={{ paddingTop: showSearch ? 56 : 0 }}>
        <TopBar
          onCompress={() => setShowCompress(true)}
          onSessionSelect={loadSession}
          currentSession={sessionId}
          toolsRunning={toolsRunning}
          puterReady={puterReady}
          wakeWordEnabled={wakeWordEnabled}
          onWakeWordToggle={() => setWakeWordEnabled(v => !v)}
          onSearch={() => { setShowSearch(s => !s); setTimeout(() => searchRef.current?.focus(), 100); }}
          onExport={exportChat}
          messageCount={messages.filter(m => m.id !== 'welcome').length}
        />

        <div className="max-w-2xl mx-auto px-3 py-1 space-y-1.5 pb-4">
          {messages.length <= 1 && messages[0]?.id === 'welcome' && (
            <HomeScreen name={userName || 'Bhai'} onSend={(text) => sendMessage(text)} />
          )}

          {pinnedList.length > 0 && (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-2.5 mt-1">
              <p className="text-[10px] text-amber-400 font-bold mb-1">📌 Pinned</p>
              {pinnedList.map(m => <p key={m.id} className="text-xs text-gray-500 truncate">{m.content.slice(0, 70)}…</p>)}
            </div>
          )}

          {searchQuery && (
            <div style={{ padding: '6px 10px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, fontSize: 11, color: '#818cf8', marginBottom: 4 }}>
              🔍 "{searchQuery}" — {filteredMessages.filter(m => m.id !== 'welcome').length} results
            </div>
          )}

          {filteredMessages.map(msg => (
            msg.id === 'welcome' && messages.length <= 1 ? null :
            <div key={msg.id}>
              {msg.thinking && <ThinkBubble thinking={msg.thinking} />}
              <MessageBubble
                message={msg}
                onLike={liked => handleLike(msg.id, liked)}
                onSpeak={() => handleSpeak(msg.content)}
                onCopy={() => navigator.clipboard.writeText(msg.content)}
                onPin={() => togglePin(msg.id)}
                onRegenerate={msg.role === 'assistant' ? regenerateLast : undefined}
              />
            </div>
          ))}

          {(loading || toolsRunning) && (
            <div className="flex items-center gap-3 py-1 pl-1 fade-in">
              <div className="flex gap-1.5 items-center">
                {[0,1,2].map(i => <div key={i} className="typing-dot rounded-full" style={{ width: 6, height: 6, background: '#3b82f6', opacity: 0.5 }} />)}
              </div>
              <span className="text-xs text-gray-600">
                {toolsRunning ? '🔧 Tools chal rahe hain...' : thinkMode === 'think' ? '🧠 Soch raha hoon...' : thinkMode === 'deep' ? '🔬 Deep analysis...' : 'Likh raha hoon...'}
              </span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex-shrink-0 px-4 pb-5 pt-1 bg-gradient-to-t from-[#0a0b0f] via-[#0a0b0f] to-transparent">
        <div className="max-w-2xl mx-auto">
          <InputBar
            onVisionResult={handleVisionResult}
            value={input} onChange={setInput}
            onSend={sendMessage} loading={loading}
            onStop={() => abortRef.current?.abort()}
            onCompress={() => setShowCompress(true)}
            currentMode={thinkMode}
            onModeChange={m => setThinkMode(m as any)}
            sessionId={sessionId}
            onSessionSelect={loadSession}
            toolsRunning={toolsRunning}
            puterReady={puterReady}
            onAppCommand={execAppCommand}
            wakeWordEnabled={wakeWordEnabled}
          />
        </div>
      </div>
    </div>
  );
}
