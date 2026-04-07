// ══════════════════════════════════════════════════════════════
// JARVIS INTELLIGENCE — Intent, Emotion, Personality, System Prompt
// ══════════════════════════════════════════════════════════════

// ── Personality modes ─────────────────────────────────────────
export type PersonalityMode = 'default' | 'fun' | 'serious' | 'motivational' | 'sarcastic' | 'roast' | 'philosopher' | 'teacher';

function buildPrompts(n: string): Record<PersonalityMode, string> {
  return {
    default: 'Tu JARVIS hai — ' + n + ' ka personal AI. Hinglish mein baat kar. Helpful, smart, thoda witty.',
    fun: 'Tu JARVIS hai — full entertainment mode! Emojis use kar, jokes maar, masti kar. ' + n + ' ke saath party mode mein hai.',
    serious: 'Tu JARVIS hai — professional mode. Clean, concise, no emojis. Facts aur solutions sirf.',
    motivational: 'Tu JARVIS hai — motivational guru mode! Iron Man + bhai ki tarah inspire kar. ' + n + ' ko charge kar!',
    sarcastic: 'Tu JARVIS hai — witty sarcasm mode. Sarcastically helpful — but actually helpful bhi.',
    roast: 'Tu JARVIS hai — roast mode! Friendly roast kar ' + n + ' ko. Lovingly savage.',
    philosopher: 'Tu JARVIS hai — philosopher mode. Deep questions, Hindi quotes. Stoic + Indian wisdom.',
    teacher: 'Tu JARVIS hai — teacher mode. Explain with examples, step-by-step.',
  };
}
export function getPersonalityPrompts(): Record<PersonalityMode, string> {
  if (typeof window === 'undefined') return buildPrompts('Bhai');
  try {
    const p = JSON.parse(localStorage.getItem('jarvis_profile') || '{}');
    return buildPrompts(p.name || 'Bhai');
  } catch { return buildPrompts('Bhai'); }
}
const PERSONALITY_PROMPTS = buildPrompts('Bhai');

// ── Emotion detection ─────────────────────────────────────────
export function detectEmotion(text: string): string {
  const t = text.toLowerCase();
  if (t.match(/sad|dukhi|udaas|rona|cry|depressed|bura lag|hurt|lonely/)) return 'sad';
  if (t.match(/angry|gussa|frustrated|pareshan|irritated|bura/)) return 'frustrated';
  if (t.match(/excited|khush|happy|amazing|great|excellent|mast|dhakkas/)) return 'happy';
  if (t.match(/scared|darr|nervous|anxious|tension|worried|chinta/)) return 'anxious';
  if (t.match(/bored|boring|kuch nahi|timepass|bakwas|pagal/)) return 'bored';
  if (t.match(/love|pyaar|romance|cute|sweet|crush/)) return 'romantic';
  if (t.match(/stress|pressure|deadline|exam|test|interview/)) return 'stressed';
  return 'neutral';
}

// ── Conversation mode detection ───────────────────────────────
export function detectConversationMode(text: string): string {
  const t = text.toLowerCase();
  if (t.match(/code|function|error|debug|programming|javascript|python|react/)) return 'technical';
  if (t.match(/write|draft|email|letter|essay|story|poem/)) return 'creative';
  if (t.match(/explain|what|why|how|kya|kyu|kaise|batao/)) return 'educational';
  if (t.match(/how are|kaise ho|mood|feel|baat|rant/)) return 'casual';
  if (t.match(/help|assist|karo|chahiye|please/)) return 'assistance';
  return 'general';
}

// ── Think mode override ────────────────────────────────────────
export function detectThinkMode(text: string, userMode: string): 'flash' | 'think' | 'deep' | 'auto' {
  if (userMode !== 'auto') return userMode as any;
  const t = text.toLowerCase();
  if (t.match(/analyze|analysis|compare|vs|versus|explain deeply|step by step|pros cons|plan/)) return 'deep';
  if (t.match(/code|debug|math|calculate|solve|logic|algorithm|complex/)) return 'think';
  return 'flash';
}

// ── System prompt builder ──────────────────────────────────────
export function getSystemPrompt(
  personality: PersonalityMode | string,
  profile: any,
  memories: string[],
  emotion: string,
  hour: number,
  toolResults?: string[]
): string {
  const p = dynPrompts[personality as PersonalityMode] || dynPrompts.default;
  const name = profile?.name || 'Bhai';
  const dynPrompts = buildPrompts(name);
  const timeCtx = hour < 12 ? 'Subah' : hour < 17 ? 'Dopahar' : hour < 21 ? 'Shaam' : 'Raat';

  const emotionCtx: Record<string, string> = {
    sad: 'User thoda sad lag raha hai — extra supportive aur empathetic reh.',
    frustrated: 'User frustrated hai — calm, solution-focused reh.',
    happy: 'User khush hai — match their energy!',
    anxious: 'User nervous/anxious hai — reassuring aur grounding reh.',
    stressed: 'User stressed hai — practical help aur reassurance de.',
    bored: 'User bored hai — engaging, interesting content de.',
  };

  const locationStr = profile?.location ? `, ${profile.location}` : '';
  let sys = `${p}\n\nUser ka naam: ${name}. Abhi ${timeCtx} hai, IST${locationStr}.`;

  if (emotion !== 'neutral' && emotionCtx[emotion]) sys += `\n\nContext: ${emotionCtx[emotion]}`;

  if (memories.length > 0) {
    sys += `\n\n**User ke baare mein yaad hai:**\n${memories.slice(0, 10).map(m => `- ${m}`).join('\n')}`;
  }

  if (toolResults && toolResults.length > 0) {
    sys += `\n\n**Real-time Data (tools se mila):**\n${toolResults.join('\n\n')}`;
    sys += `\n\nYeh tool data use karke answer de. Data ko natural conversation mein weave kar.`;
  }

  sys += `\n\nRules:\n- Hinglish preferred (Hindi + English mix)\n- Concise but complete\n- Never say "As an AI..." — tu JARVIS hai\n- Tool data agar hai toh use it, fabricate mat kar`;

  return sys;
}

// ── Offline keyword fallback ───────────────────────────────────
export function keywordFallback(query: string): string {
  const q = query.toLowerCase();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Subah' : hour < 17 ? 'Dopahar' : hour < 21 ? 'Shaam' : 'Raat';

  if (q.match(/hello|hi|hey|namaste|hii/)) return `${greet} Bhai! 👋 Main JARVIS hoon — kya help chahiye?`;
  if (q.match(/how are|kaise ho|kaisa/)) return `Main ekdum mast hoon Bhai! Tum batao — kya chal raha hai? 😊`;
  if (q.match(/joke|funny|mazak/)) return `😂 Ek baar ek programmer ne apni girlfriend se kaha: "Main tumse pyaar karta hoon."\nGirlfriend: "Yeh prove karo!"\nProgrammer: "It's true, I have no bugs in my feelings."`;
  if (q.match(/motivation|inspire/)) return `💪 "Haar woh nahi jab tum gir jaate ho,\nHaar woh hai jab tum uthne se inkaar kar dete ho."\n\nChalo Bhai — uthke chal!`;
  if (q.match(/time|kitne baje/)) return `⏰ Abhi ${new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} ho rahi hai (IST)`;
  if (q.match(/thanks|shukriya|dhanyawad/)) return `Koi baat nahi Bhai! Sada tumhari seva mein 🙏`;
  if (q.match(/bye|alvida|baad mein/)) return `Alvida Bhai! Agar kuch chahiye toh bulana 👋`;

  return `🤔 Internet lagta hai slow hai — but main hoon! "${query}" ke baare mein offline mode mein answer dene ki koshish kar raha hoon. Thodi der mein internet aane par better jawab milega.`;
}

// ── AI Session Title Generator ─────────────────────────────────
// Step 1: instant keyword title (no API)
// Step 2: Groq generates smart title silently in background
export function quickTitle(text: string): string {
  const t = text.trim();
  if (!t) return 'Naya Chat';
  // Remove slash commands
  const clean = t.replace(/^\/\w+\s*/, '').trim();
  // Capitalize and truncate
  const words = clean.split(' ').slice(0, 5).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1) || 'Naya Chat';
}

export async function generateSessionTitle(text: string, groqKey?: string): Promise<string> {
  if (!groqKey) return quickTitle(text);
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // cheapest — title ke liye kaafi hai
        messages: [
          { role: 'system', content: 'Generate a short 3-5 word chat title in the same language as the user message. No quotes, no punctuation. Just the title.' },
          { role: 'user', content: text.slice(0, 200) }
        ],
        max_tokens: 20, temperature: 0.3,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return quickTitle(text);
    const d = await r.json();
    const title = d.choices?.[0]?.message?.content?.trim();
    return title || quickTitle(text);
  } catch {
    return quickTitle(text);
  }
}
