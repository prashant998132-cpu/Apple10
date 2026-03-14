'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { detectConversationMode, detectEmotion, detectThinkMode, getSystemPrompt, keywordFallback, PersonalityMode } from '@/lib/intelligence';
import { addXP, updateStreak, getProfile, saveMemory, extractProfileInfo, logEmotion, trackTopic, getRelationshipName } from '@/lib/memory';
import { getLocation, getCachedLocation, formatLocation } from '@/lib/location';
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
import JarvisOrb from '@/components/JarvisOrb';
import CompressPopup from '@/components/CompressPopup';
import ToastContainer, { showToast } from '@/components/Toast';
import PWAInstall from '@/components/PWAInstall';
import { generateSessionTitle, quickTitle } from '@/lib/intelligence';
import { trackApiCall } from '@/lib/apiStats';
import { isDuplicateAIRequest, trackVercelCall, getVercelUsage } from '@/lib/smartCache';
import { initAgents, setReminder, parseReminderIntent, queueAgentTask, showNotification } from '@/lib/agentManager';
import { detectAppsForQuery, isAppEnabled } from '@/lib/connectedApps';
import { extractAndStoreFacts, getRelevantMemories, getProactiveSuggestion, getMemorySummary } from '@/lib/crossSessionMemory';
import {
  getBattery, watchBattery, formatBattery, watchNetwork, getNetworkQuality, networkQualityToMode,
  requestWakeLock, releaseWakeLock, isWakeLockActive, setupWakeLockPersist,
  setBadge, clearBadge, setupMediaSession, clearMediaSession, setMediaSessionPlayback,
  getDeviceCapabilities, VIBRATE, readClipboard, shareText,
  isContactPickerSupported, pickContactForCall,
} from '@/lib/nativeAPIs';
// canvas-confetti removed — canvas:false in webpack

export interface Message {
  id: string; role: 'user' | 'assistant'; content: string; ts: number;
  mode?: string; type?: 'text' | 'image' | 'tool';
  imageUrl?: string; liked?: boolean; pinned?: boolean; thinking?: string;
  toolsUsed?: string[];
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
  const puterReady = false; // Puter login removed
  const [sessionTitle, setSessionTitle] = useState('Naya Chat');
  const [toolsRunning, setToolsRunning] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  // Native API states
  const [batteryInfo, setBatteryInfo] = useState<string>('');
  const [networkQuality, setNetworkQuality] = useState<'fast'|'medium'|'slow'|'offline'>('fast');
  const [voiceLoopActive, setVoiceLoopActive] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── App Control Handler ──────────────────────────────────────
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
      default:
        break;
    }
  }, []);

  useEffect(() => {
    (async () => {
      await updateStreak();
      const p = await getProfile();
      setThinkMode(p.thinkMode || 'auto');
      setPersonality(p.personality as PersonalityMode || 'default');
      setRelationship(getRelationshipName(p.xp || 0));

      // Welcome message
      const hour = new Date().getHours();
      const greet = hour < 12 ? '🌅 Subah' : hour < 17 ? '☀️ Dopahar' : hour < 21 ? '🌆 Shaam' : '🌙 Raat';
      const rel = getRelationshipName(p.xp || 0);
      const welcomeMsg = `**Namaste Jons Bhai! ${greet} mubarak.** ${rel.icon}\n\n${p.name ? `${p.name}, aaj kya plan hai?` : 'Kya help chahiye aaj?'}`;
      setMessages([{ id: 'welcome', role: 'assistant', ts: Date.now(), content: welcomeMsg }]);

      // Proactive suggestion from cross-session memory
      const proactive = getProactiveSuggestion();
      if (proactive) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `ps_${Date.now()}`, role: 'assistant', ts: Date.now(), content: proactive
          }]);
        }, 3000);
      }

      // Auto morning briefing (8-10am only, once per day)
      if (hour >= 8 && hour <= 10) {
        const briefingKey = `briefed_${new Date().toDateString()}`;
        if (!localStorage.getItem(briefingKey)) {
          localStorage.setItem(briefingKey, '1');
          setTimeout(async () => {
            const briefing = await getMorningBriefing();
            setMessages(prev => [...prev, {
              id: `briefing_${Date.now()}`, role: 'assistant', ts: Date.now(),
              content: `📋 **Aaj ki Morning Briefing:**\n\n${briefing}`,
            }]);
            speakText(`Subah mubarak Jons Bhai! Mausam aur news ready hai.`);
          }, 1500);
        }
      }

      // Fetch real location silently
      const cachedLoc = getCachedLocation();
      if (!cachedLoc) {
        getLocation().then(loc => {
          if (loc.city && typeof window !== 'undefined') {
            // Save to profile for system prompt
            const profileRaw = localStorage.getItem('jarvis_profile');
            const profile = profileRaw ? JSON.parse(profileRaw) : {};
            profile.location = formatLocation(loc);
            localStorage.setItem('jarvis_profile', JSON.stringify(profile));
          }
        }).catch(() => {});
      }

      // Register SW + Init background agents
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
        // Tell SW to register periodic sync
        navigator.serviceWorker.ready.then(reg => {
          reg.active?.postMessage({ type: 'REGISTER_PERIODIC_SYNC' });
        }).catch(() => {});
        // Listen for SW messages
        navigator.serviceWorker.addEventListener('message', (e) => {
          if (e.data?.type === 'QUEUE_FLUSHED') {
            showToast(`${e.data.count} offline messages sent!`, '📡', 'success');
          }
          if (e.data?.type === 'NOTIFICATION_CLICK') {
            const cmd = new URL(e.data.url, window.location.origin).searchParams.get('cmd');
            if (cmd) setInput(cmd);
          }
        });
      }

      // ── Native APIs init ──────────────────────────────────
      // Battery
      watchBattery((info) => {
        setBatteryInfo(formatBattery(info));
        if (info.level < 0.1 && !info.charging) {
          showToast(`Battery ${Math.round(info.level*100)}% — Charger lagao!`, '🔋', 'warning');
          VIBRATE.error();
        }
      });

      // Network quality watcher → adaptive AI mode
      const netCleanup = watchNetwork((q) => {
        setNetworkQuality(q);
        if (q === 'offline') showToast('Internet nahi hai — offline mode', '📵', 'warning');
        if (q === 'slow') showToast('Slow connection — Flash mode preferred', '🐢', 'info');
      });
      setNetworkQuality(getNetworkQuality());

      // Badge — clear on open
      clearBadge();

      // Setup wake lock persist on page show
      setupWakeLockPersist();

      // Handle URL shortcuts from manifest (/?voice=1, /?cmd=..., /?new=1)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const cmdParam = params.get('cmd');
        const voiceParam = params.get('voice');
        const newParam = params.get('new');
        if (cmdParam) {
          setTimeout(() => setInput(cmdParam), 500);
        }
        if (voiceParam === '1') {
          setTimeout(() => setVoiceLoopActive(true), 800);
        }
        if (newParam === '1') {
          setMessages([]);
          setSessionId(`session_${Date.now()}`);
        }

        // Share Target v2 — files shared from other apps
        if (window.location.search.includes('shared_') || document.referrer.includes('share')) {
          // POST share target handled by Next.js, but we can also read from URL
          const sharedText = params.get('shared_text') || params.get('text');
          if (sharedText) {
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: `share_${Date.now()}`, role: 'user', ts: Date.now(), content: sharedText
              }]);
            }, 600);
          }
        }

        // Web Share Target — file received (POST from manifest share_target)
        // LaunchQueue API — file opened via file_handlers in manifest
        if ('launchQueue' in window) {
          (window as any).launchQueue.setConsumer(async (launchParams: any) => {
            if (!launchParams.files?.length) return;
            const file = await launchParams.files[0].getFile();
            if (file.type.startsWith('image/')) {
              showToast(`Image received: ${file.name}`, '🖼️', 'info');
              setInput(`/image analyze karo: ${file.name}`);
            } else if (file.type === 'application/pdf') {
              showToast(`PDF received: ${file.name}`, '📄', 'info');
              setInput(`/pdf summarize: ${file.name}`);
            } else if (file.type.startsWith('text/')) {
              const text = await file.text();
              setInput(text.slice(0, 500));
            }
          });
        }
      }

      return () => { netCleanup(); };
      initAgents((msg) => setMessages(prev => [...prev, {
        id: `agent_${Date.now()}`, role: 'assistant', ts: Date.now(), content: msg
      }]));

      // Proactive engine
      const cleanup = startProactiveEngine((msg: string) => {
        setMessages(prev => [...prev, { id: `p_${Date.now()}`, role: 'assistant', content: msg, ts: Date.now() }]);
      });
      return cleanup;
    })();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Social post generator
  const generateSocialPost = async (topic: string): Promise<string> => {
    const r = await fetch('/api/stream', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Generate an engaging Instagram/WhatsApp post about: "${topic}". Include: catchy headline, 3-4 lines content, 5 relevant hashtags. Hinglish style.` }],
        system: 'You are a social media expert. Create viral, engaging posts.',
        mode: 'flash',
      }),
    });
    const reader = r.body!.getReader();
    const dec = new TextDecoder();
    let out = '', buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value);
      const lines = buf.split('\n'); buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try { const t = JSON.parse(line.slice(6))?.text; if (t) out += t; } catch {}
      }
    }
    return out;
  };

  // Image generation — Puter DALL-E 3 (if signed in) → Pollinations FLUX fallback
  const generateImage = async (prompt: string): Promise<{ url: string; source: string }> => {
    // Try Puter first — lazy load, never triggers login popup
    try {
      const { loadPuter, isPuterSignedIn, puterGenerateImage } = await import('@/lib/puter');
      const loaded = await loadPuter();
      if (loaded) {
        const signedIn = await isPuterSignedIn();
        if (signedIn) {
          const url = await puterGenerateImage(prompt);
          if (url) return { url, source: 'DALL-E 3 (Puter)' };
        }
      }
    } catch {}
    // Fallback — Pollinations FLUX (always works, no login)
    const r = await fetch('/api/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
    const d = await r.json();
    return { url: d.url, source: 'Pollinations FLUX' };
  };

  // Main send
  const sendMessage = useCallback(async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    // Prevent accidental double-fire (React strict mode / fast taps)
    if (isDuplicateAIRequest(userText)) return;
    setInput('');

    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', content: userText, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    // Generate session title from first user message
    if (messages.filter(m => m.role === 'user').length === 0) {
      const instant = quickTitle(userText);
      setSessionTitle(instant);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(`session_title_${sessionId}`, instant); } catch {}
      }
      // Background: generate smarter title via Groq
      generateSessionTitle(userText, process.env.NEXT_PUBLIC_GROQ_KEY).then(smart => {
        if (smart && smart !== instant) {
          setSessionTitle(smart);
          if (typeof window !== 'undefined') {
            try { localStorage.setItem(`session_title_${sessionId}`, smart); } catch {}
          }
        }
      }).catch(() => {});
    }
    setLoading(true);
    // Badge: show 1 unread while AI is thinking
    setBadge(1);

    const db = getDB();
    if (db) await db.messages.add({ sessionId, role: 'user', content: userText, ts: Date.now() });
    syncMessageToCloud({ session_id: sessionId, role: 'user', content: userText, ts: Date.now() }).catch(() => {});
    storeMemoryVector(`u_${Date.now()}`, userText, { role: 'user' }).catch(() => {});

    extractProfileInfo(userText);
    trackTopic(detectConversationMode(userText));
    const emotion = detectEmotion(userText);
    if (emotion !== 'neutral') logEmotion(emotion, userText);

    // ── Native API slash commands ─────────────────────────────
    if (userText.match(/^\/battery|^battery kitna|^battery status/i)) {
      const info = await getBattery();
      const msg = info ? `🔋 **Battery:**\n${formatBattery(info)}` : '🔋 Battery API support nahi';
      setMessages(prev => [...prev, { id: `bat_${Date.now()}`, role: 'assistant', ts: Date.now(), content: msg }]);
      setLoading(false); clearBadge(); return;
    }
    if (userText.match(/^\/caps|device capabilities/i)) {
      const caps = getDeviceCapabilities();
      const lines = Object.entries(caps).map(([k,v]) => `${v?'✅':'❌'} ${k}`).join('\n');
      setMessages(prev => [...prev, { id: `caps_${Date.now()}`, role: 'assistant', ts: Date.now(), content: `📱 **Device Capabilities:**\n\n${lines}` }]);
      setLoading(false); clearBadge(); return;
    }
    if (userText.match(/^\/clip|clipboard kya hai|copy kya hai/i)) {
      const text = await readClipboard();
      const msg = text ? `📋 **Clipboard:**\n\n${text.slice(0, 500)}` : '📋 Clipboard empty ya permission nahi';
      setMessages(prev => [...prev, { id: `clip_${Date.now()}`, role: 'assistant', ts: Date.now(), content: msg }]);
      setLoading(false); clearBadge(); return;
    }
    // Contact picker — "contact se call karo"
    if (userText.match(/contact se call|pick contact|contact list se/i) && isContactPickerSupported()) {
      const contact = await pickContactForCall();
      if (contact) {
        if (typeof window !== 'undefined') window.location.href = `tel:${contact.number}`;
        setMessages(prev => [...prev, { id: `call_${Date.now()}`, role: 'assistant', ts: Date.now(), content: `📞 **${contact.name}** — ${contact.number} — calling...` }]);
        setLoading(false); clearBadge(); return;
      }
    }

    // Handle /memory command
    if (userText.match(/^\/memory/i)) {
      const summary = getMemorySummary();
      setMessages(prev => [...prev, { id: `a_${Date.now()}`, role: 'assistant', ts: Date.now(), content: summary }]);
      setLoading(false); return;
    }

    // Handle /location command — refresh real location
    if (userText.match(/^\/location/i)) {
      const { getLocation, formatLocation, clearLocationCache } = await import('@/lib/location');
      clearLocationCache();
      const loc = await getLocation(true);
      const locStr = formatLocation(loc);
      showToast(locStr ? `📍 ${locStr}` : 'Location nahi mili', '📍', loc.city ? 'success' : 'warning');
      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`, role: 'assistant', ts: Date.now(),
        content: loc.city
          ? `📍 **Location detected:** ${locStr}\n*Source: ${loc.source}*`
          : '📍 Location detect nahi ho payi. Browser mein location permission allow karo.'
      }]);
      setLoading(false); return;
    }

    // Handle /search command — real web search
    if (userText.match(/^\/search\s+/i)) {
      const query = userText.replace(/^\/search\s+/i, '').trim();
      try {
        const r = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
        const d = await r.json();
        let searchResult = '';
        if (d.answer) {
          searchResult = '🔍 **' + query + '**\n\n' + d.answer;
        } else if (d.results?.length) {
          const items = (d.results as any[]).slice(0,3).map(rs => '**' + rs.title + '**\n' + rs.snippet).join('\n\n');
          searchResult = '🔍 **' + query + '**\n\n' + items;
        } else {
          searchResult = '🔍 ' + query + ' ke liye koi result nahi mila.';
        }
        setMessages(prev => [...prev, { id: 's_' + Date.now(), role: 'assistant' as const, ts: Date.now(), content: searchResult }]);
      } catch {
        setMessages(prev => [...prev, { id: 's_' + Date.now(), role: 'assistant' as const, ts: Date.now(), content: '🔍 Search fail ho gayi. Internet check karo.' }]);
      }
      setLoading(false); return;
    }

    // Reminder intent detection
    const reminderIntent = parseReminderIntent(userText);
    if (userText.toLowerCase().match(/remind|yaad dila|alarm|reminder/i) && reminderIntent) {
      const ok = await setReminder(reminderIntent.task, reminderIntent.ms);
      const mins = Math.round(reminderIntent.ms / 60000);
      const unit = mins >= 60 ? `${Math.round(mins/60)} ghante` : `${mins} minute`;
      setMessages(prev => [...prev, {
        id: `r_${Date.now()}`, role: 'assistant', ts: Date.now(),
        content: ok
          ? `⏰ **Reminder set!** "${reminderIntent.task}" — ${unit} mein yaad dilaaunga! ✅`
          : `❌ Reminder set nahi ho paya. Notifications allow karo.`
      }]);
      setLoading(false); return;
    }

    // ── Voice/Text command detection ─────────────────────────
    const voiceCmd = detectVoiceCommand(userText);
    if (voiceCmd.type === 'deeplink' && voiceCmd.payload?.url) {
      executeDeepLink(voiceCmd.payload.url);
      setMessages(prev => [...prev, {
        id: `cmd_${Date.now()}`, role: 'assistant', ts: Date.now(),
        content: `🚀 **${voiceCmd.payload.name} khol raha hoon!**\n\n*Deep link: ${voiceCmd.payload.url.substring(0, 40)}...*`,
      }]);
      setLoading(false); return;
    }
    if (voiceCmd.type === 'appcontrol') {
      execAppCommand(voiceCmd.action, voiceCmd.payload);
      setMessages(prev => [...prev, {
        id: `cmd_${Date.now()}`, role: 'assistant', ts: Date.now(),
        content: `✅ ${voiceCmd.spoken || 'Done!'}`,
      }]);
      setLoading(false); return;
    }

    // ── Agent Intent Detection ────────────────────────────────
    if (isAgentIntent(userText)) {
      // No /agent page — do it in-chat with step breakdown
      const agentMsg = `🤖 **Agent Mode — Multi-Step Task**\n\n"${userText}"\n\n_Step 1/3: Analyzing task..._\n\nIs task ko main automatically steps mein todkar execute karunga. Abhi AI se full plan le raha hoon...`;
      setMessages(prev => [...prev, {
        id: `agent_${Date.now()}`, role: 'assistant', ts: Date.now(), content: agentMsg,
      }]);
      // Fall through to normal AI call — system prompt will handle it
    }

    // Auto-detect connected apps for this query
    const matchedApps = detectAppsForQuery(userText);
    if (matchedApps.length > 0) {
      const appDefs = (await import('@/lib/connectedApps')).APP_DEFS;
      const names = matchedApps.slice(0, 2).map(id => {
        const def = appDefs.find(a => a.id === id);
        return def ? `${def.icon} ${def.name}` : id;
      });
      showToast(`Using: ${names.join(' + ')}`, '🔌', 'info', 2000);
    }

    // Handle /image command separately
    if (userText.match(/^\/image|^\/img/i)) {
      const prompt = userText.replace(/^\/img\s*|^\/image\s*/i, '') || 'beautiful futuristic India';
      const { url, source } = await generateImage(prompt);
      const aiMsg: Message = { id: `a_${Date.now()}`, role: 'assistant', ts: Date.now(), type: 'image', imageUrl: url, content: `🎨 **"${prompt}"**\n*via ${source}*` };
      setMessages(prev => [...prev, aiMsg]);
      if (db) await db.messages.add({ sessionId, role: 'assistant', content: aiMsg.content, ts: Date.now() });
      await addXP(2);
      setLoading(false);
      return;
    }

    // ── AUTONOMOUS TOOL EXECUTION ────────────────────────────
    let toolResultTexts: string[] = [];
    let toolsUsedNames: string[] = [];

    if (queryNeedsTools(userText)) {
      setToolsRunning(true);
      try {
        const toolResults = await runAutonomousTools(userText, 2);
        for (const tr of toolResults) {
          if (tr.data?.startsWith?.('__SOCIAL_POST_REQUEST__')) {
            // Social post — handle separately
            const topic = tr.data.replace('__SOCIAL_POST_REQUEST__:', '');
            const post = await generateSocialPost(topic);
            const aiMsg: Message = { id: `a_${Date.now()}`, role: 'assistant', ts: Date.now(), content: `📱 **Social Post — "${topic}"**\n\n${post}` };
            setMessages(prev => [...prev, aiMsg]);
            if (db) await db.messages.add({ sessionId, role: 'assistant', content: aiMsg.content, ts: Date.now() });
            setLoading(false); setToolsRunning(false);
            return;
          }
          toolResultTexts.push(tr.data);
          toolsUsedNames.push(tr.tool);
        }
      } catch {}
      setToolsRunning(false);
    }

    // If tools returned complete answer and no AI needed
    if (toolResultTexts.length > 0 && userText.match(/^(weather|mausam|joke|quote|time|kitne baje|holiday|crypto|iss|news)\s*$/i)) {
      const aiMsg: Message = {
        id: `a_${Date.now()}`, role: 'assistant', ts: Date.now(),
        content: toolResultTexts.join('\n\n---\n\n'),
        toolsUsed: toolsUsedNames,
      };
      setMessages(prev => [...prev, aiMsg]);
      if (db) await db.messages.add({ sessionId, role: 'assistant', content: aiMsg.content, ts: Date.now() });
      await addXP(2);
      setLoading(false);
      return;
    }

    // ── AI GENERATION (with tool context) ───────────────────
    // Network adaptive: 2G pe Deep → Flash automatically
    const rawMode = detectThinkMode(userText, thinkMode);
    const mode = networkQualityToMode(networkQuality, rawMode);
    if (mode !== rawMode) showToast(`${networkQuality} connection — ${mode} mode use kar raha`, '📶', 'info', 2000);
    const profile = await getProfile(); // single call — cached below
    const vectorResults = await searchMemoryVectors(userText, 8);  // was 5
    const crossMems = getRelevantMemories(userText, 6);             // was 4
    const memTexts = [...new Set([...vectorResults.map(r => r.text), ...crossMems])];
    const system = getSystemPrompt(personality, profile, memTexts, emotion, new Date().getHours(), toolResultTexts);
    const histMsgs = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

    const aiId = `a_${Date.now()}`;
    setMessages(prev => [...prev, { id: aiId, role: 'assistant', content: '', ts: Date.now(), mode, toolsUsed: toolsUsedNames }]);
    abortRef.current = new AbortController();

    // Deep mode → Gemini function calling
    if (mode === 'deep') {
      try {
        const dr = await fetch('/api/deep', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...histMsgs, { role: 'user', content: userText }], system }),
          signal: abortRef.current.signal,
        });
        if (dr.ok) {
          const dd = await dr.json();
          if (dd.text) {
            let fullText = dd.text;
            if (dd.toolsUsed?.length) fullText += `\n\n*🔬 Tools: ${dd.toolsUsed.join(', ')}*`;
            setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText } : m));
            if (db) await db.messages.add({ sessionId, role: 'assistant', content: fullText, ts: Date.now() });
            syncMessageToCloud({ session_id: sessionId, role: 'assistant', content: fullText, ts: Date.now() }).catch(() => {});
            await addXP(3);
            setRelationship(getRelationshipName((profile.xp || 0) + 3));
            setLoading(false); return;
          }
        }
      } catch (e: any) { if (e.name === 'AbortError') { setLoading(false); return; } }
    }

    // Stream
    try {
      const res = await fetch('/api/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...histMsgs, { role: 'user', content: userText }], system, mode }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error('Stream failed');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '', thinkingText = '', buf = '', inThink = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value);
        const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const t = JSON.parse(data)?.text;
            if (t) {
              if (t.includes('<think>')) inThink = true;
              if (t.includes('</think>')) { inThink = false; continue; }
              if (inThink) thinkingText += t.replace('<think>', '');
              else fullText += t;
              setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText, thinking: thinkingText || undefined } : m));
            }
          } catch {}
        }
      }

      if (!fullText) fullText = keywordFallback(userText);
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText, thinking: thinkingText || undefined } : m));
      if (db) await db.messages.add({ sessionId, role: 'assistant', content: fullText, ts: Date.now() });

      syncMessageToCloud({ session_id: sessionId, role: 'assistant', content: fullText, ts: Date.now() }).catch(() => {});
      if (fullText.length > 40) {
        storeMemoryVector(`a_${Date.now()}`, fullText.slice(0, 200), { role: 'assistant' }).catch(() => {});
        saveMemory(userText.slice(0, 80), 'general', 3).catch(() => {});
        // Cross-session learning
        extractAndStoreFacts(userText, fullText);
      }

      const { leveled, level } = await addXP(2);
      if (leveled) {
        showToast(`Level Up! Ab Level ${level} ho gaye! 🏆`, '🎉', 'success');
        setMessages(prev => [...prev, { id: `lv_${Date.now()}`, role: 'assistant', ts: Date.now(), content: `🏆 **Level Up! Jons Bhai ab Level ${level} hai!** 🎉` }]);
      }
      // Use already-fetched profile — no extra getProfile() call
      const updatedXp = (profile.xp || 0) + 2;
      setRelationship(getRelationshipName(updatedXp));

    } catch (e: any) {
      if (e.name === 'AbortError') { setLoading(false); return; }
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: keywordFallback(userText) } : m));
    }
    setLoading(false);
    clearBadge();
  }, [input, loading, messages, thinkMode, personality, sessionId, networkQuality]);

  const togglePin = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
    setPinnedMsgs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleLike = async (id: string, liked: boolean) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, liked } : m));
    if (liked) { await addXP(3); saveMemory('User ne response pasand kiya', 'preference', 7); }
    else saveMemory('User ko response pasand nahi tha', 'correction', 9);
  };

  const handleSpeak = async (text: string) => {
    const clean = text.replace(/[#*`>\[\]]/g, '').slice(0, 400);
    // Try Puter TTS first (high quality) — lazy, no login popup
    try {
      const { loadPuter, isPuterSignedIn, puterSpeak } = await import('@/lib/puter');
      const loaded = await loadPuter();
      if (loaded && await isPuterSignedIn()) {
        const ok = await puterSpeak(clean);
        if (ok) return;
      }
    } catch {}
    // Fallback TTS
    try {
      const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: clean }) });
      const d = await r.json();
      if (d.url) { new Audio(d.url).play(); return; }
    } catch {}
    speakText(clean);
  };

  const handleVisionResult = (result: string) => {
    const aiMsg: Message = { id: `v_${Date.now()}`, role: 'assistant', ts: Date.now(), content: result };
    setMessages(prev => [...prev, aiMsg]);
  };

  const loadSession = async (sid: string) => {
    setSessionId(sid);
    const db = getDB(); if (!db) return;
    const msgs = await db.messages.where('sessionId').equals(sid).sortBy('ts');
    if (msgs.length > 0) {
      setMessages(msgs.map(m => ({ id: String(m.id || Date.now()), role: m.role as 'user'|'assistant', content: m.content, ts: m.ts })));
    } else {
      setMessages([]);
    }
  };

  const pinnedList = messages.filter(m => m.pinned);

  return (
    <div className="flex flex-col bg-[#0a0b0f]" style={{ height: '100%', overflow: 'hidden' }}>
      <ToastContainer />
      {showCompress && <CompressPopup onClose={() => setShowCompress(false)} />}

      {/* ── MESSAGES — FULL HEIGHT, zero header rows ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingTop: '0px' }}>

        {/* ── TOP FLOATING BAR ── */}
        <TopBar
          onCompress={() => setShowCompress(true)}
          onSessionSelect={loadSession}
          currentSession={sessionId}
          toolsRunning={toolsRunning}
          puterReady={puterReady}
          wakeWordEnabled={wakeWordEnabled}
          onWakeWordToggle={() => setWakeWordEnabled(v => !v)}
        />

        <div className="max-w-2xl mx-auto px-4 py-2 space-y-5 pb-6">

          {/* Pinned bar */}
          {pinnedList.length > 0 && (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-2.5 mt-1">
              <p className="text-[10px] text-amber-400 font-bold mb-1">📌 Pinned</p>
              {pinnedList.map(m => (
                <p key={m.id} className="text-xs text-gray-500 truncate">{m.content.slice(0, 70)}…</p>
              ))}
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id}>
              {msg.thinking && <ThinkBubble thinking={msg.thinking} />}
              <MessageBubble
                message={msg}
                onLike={liked => handleLike(msg.id, liked)}
                onSpeak={() => handleSpeak(msg.content)}
                onCopy={() => navigator.clipboard.writeText(msg.content)}
                onPin={() => togglePin(msg.id)}
              />
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {msg.toolsUsed.map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 bg-blue-500/8 text-blue-400/60 rounded-full border border-blue-500/10">
                      🔧 {t.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {(loading || toolsRunning) && (
            <div className="flex items-center gap-3 py-1 pl-1 fade-in">
              <div className="flex gap-1.5 items-center">
                {[0,1,2].map(i => (
                  <div key={i} className="typing-dot rounded-full"
                    style={{ width: 6, height: 6, background: '#3b82f6', opacity: 0.5 }} />
                ))}
              </div>
              <span className="text-xs text-gray-600">
                {toolsRunning ? '🔧 Tools chal rahe hain...' : thinkMode === 'think' ? '🧠 Soch raha hoon...' : thinkMode === 'deep' ? '🔬 Deep analysis...' : 'Likh raha hoon...'}
              </span>
            </div>
          )}



          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── INPUT BAR — bottom, no border/bg overhead, ChatGPT style ── */}
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
