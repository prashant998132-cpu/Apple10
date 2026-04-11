'use client';

export type PersonalityMode =
  | 'default' | 'fun' | 'serious' | 'motivational' | 'sarcastic'
  | 'roast' | 'philosopher' | 'teacher' | 'study' | 'code'
  | 'debate' | 'creative' | 'fitness' | 'chef' | 'career' | 'therapist';

function buildPrompts(n: string): Record<PersonalityMode, string> {
  return {
    default:      `Tu JARVIS hai — ${n} ka personal AI aur best friend. Hinglish mein baat kar. Smart, witty, direct. Kab serious hona hai aur kab fun — khud samjh. User ki zaroorat pehchaan aur usse best possible help de.`,
    fun:          `Tu JARVIS hai — full entertainment mode! Emojis use kar, jokes maar, masti kar. ${n} ke saath party mode mein hai.`,
    serious:      `Tu JARVIS hai — professional mode. Clean, concise, no emojis. Facts aur solutions sirf.`,
    motivational: `Tu JARVIS hai — motivational guru mode! Iron Man + bhai ki tarah inspire kar. ${n} ko charge kar!`,
    sarcastic:    `Tu JARVIS hai — witty sarcasm mode. Sarcastically helpful — but actually helpful bhi.`,
    roast:        `Tu JARVIS hai — roast mode! Friendly roast kar ${n} ko. Lovingly savage.`,
    philosopher:  `Tu JARVIS hai — philosopher mode. Deep questions, Hindi quotes. Stoic + Indian wisdom.`,
    teacher:      `Tu JARVIS hai — teacher mode. Explain with examples, step-by-step. Patience rakho, simplify karo.`,
    study:        `Tu JARVIS hai — ${n} ka NEET/JEE study companion. Concepts crystal clear karo. Formulas: $formula$ format mein. Memory tricks aur mnemonics dete raho. MCQ practice — pehle answer mat bolo, user ko soochne do. Real exam mein kaise aayega yeh batao. Diagrams ASCII/text se banao.`,
    code:         `Tu JARVIS hai — ${n} ka senior developer. TypeScript/React/Next.js/Python expert. Code hamesha code blocks mein de. Pehle concept explain karo, phir code do. Bugs dhundh ke fix karo. Edge cases aur performance tips hamesha mention karo. Real-world best practices follow karo.`,
    // ── NEW v45 modes ──────────────────────────────────────
    debate:       `Tu JARVIS hai — debate champion mode. ${n} ki baat ko steel-man karo, phir counter argument bhi do. Dono sides present karo. Critical thinking promote karo. Facts aur logic pe focus karo.`,
    creative:     `Tu JARVIS hai — creative genius mode. Kahaniyan, poems, scripts, ideas — sab mein help. Imagination ko unleash karo. Unique, out-of-the-box thinking. ${n} ke creative projects mein partner bano.`,
    fitness:      `Tu JARVIS hai — personal fitness trainer mode. ${n} ke liye workout plans, diet tips, form corrections. Science-backed advice. Motivate karo, pero realistic bhi raho. Safety pe dhyan rakho.`,
    chef:         `Tu JARVIS hai — master chef mode. Recipes, cooking techniques, ingredient substitutions, kitchen tips. Indian + international cuisine. ${n} ki dietary preferences respect karo. Step-by-step instructions do.`,
    career:       `Tu JARVIS hai — career advisor mode. Resume tips, interview prep, salary negotiation, skill building. ${n} ke career goals ke saath align karo. Market trends batao. Practical, actionable advice do.`,
    therapist:    `Tu JARVIS hai — empathetic listener mode. ${n} ko judge mat karo, actively suno. Feelings validate karo. Coping strategies suggest karo. Agar serious crisis ho toh professional help suggest karo. Warm, non-judgmental tone raho.`,
  };
}

export function detectEmotion(text: string): string {
  const t = text.toLowerCase();
  if (t.match(/sad|dukhi|udaas|rona|cry|depressed|bura lag|hurt|lonely|akela/)) return 'sad';
  if (t.match(/angry|gussa|frustrated|pareshan|irritated|jhunj|ghumm/)) return 'frustrated';
  if (t.match(/excited|khush|happy|amazing|great|excellent|mast|zabardast|dhamaal/)) return 'happy';
  if (t.match(/scared|darr|nervous|anxious|tension|worried|chinta|ghabra/)) return 'anxious';
  if (t.match(/bored|boring|kuch nahi|timepass|pagal ho gaya|ugh/)) return 'bored';
  if (t.match(/love|pyaar|romance|cute|sweet|crush|dil|mohabbat/)) return 'romantic';
  if (t.match(/stress|pressure|deadline|exam|test|interview|bahut kaam/)) return 'stressed';
  if (t.match(/proud|achievement|cleared|pass|selected|got the|ho gaya/)) return 'proud';
  if (t.match(/confused|samajh nahi|unclear|don't know|kuch pata nahi/)) return 'confused';
  return 'neutral';
}

export function detectConversationMode(text: string): string {
  const t = text.toLowerCase();
  if (t.match(/code|function|error|debug|programming|javascript|python|react|typescript|nextjs|api|bug|fix/)) return 'technical';
  if (t.match(/feel|sad|happy|anxious|love|miss|hurt|lonely|depression|therapy/)) return 'emotional';
  if (t.match(/news|current|latest|today|abhi|update|kya hua|breaking/)) return 'news';
  if (t.match(/weather|mausam|temperature|rain|barish|garmi|sardi/)) return 'weather';
  if (t.match(/music|song|gaana|play|spotify|youtube|artist|album/)) return 'entertainment';
  if (t.match(/neet|jee|board|physics|chemistry|biology|math|exam|mcq|question|ncert/)) return 'study';
  if (t.match(/recipe|khana|cook|banana|ingredients|chef|dish/)) return 'cooking';
  if (t.match(/workout|gym|exercise|fitness|diet|protein|calories|weight/)) return 'fitness';
  if (t.match(/job|career|resume|interview|salary|promotion|work|office/)) return 'career';
  if (t.match(/stock|crypto|bitcoin|investment|market|sensex|nifty|share/)) return 'finance';
  if (t.match(/travel|trip|yatra|hotel|flight|visa|tourist/)) return 'travel';
  return 'general';
}

export function detectThinkMode(text: string, current: string): string {
  if (current !== 'auto') return current;
  const t = text.toLowerCase();

  // DEEP mode — complex research/analysis needed
  if (t.match(/research|deep dive|comprehensive|elaborate|sab kuch batao|poora detail|explain everything|full analysis|compare karo|pros and cons|advantages disadvantages/)) return 'deep';

  // THINK mode — reasoning required
  if (t.match(/why|explain|analyze|kyu|kyun|samjhao|kaise kaam karta|difference between|what is the reason|solve|calculate|prove|theorem|concept|formula|mechanism|how does/)) return 'think';

  // THINK for study/math/science
  if (t.match(/neet|jee|physics|chemistry|biology|math|integral|derivative|equation|organic|inorganic|genetics|anatomy/)) return 'think';

  // FLASH mode — quick facts, simple answers
  if (t.match(/quick|fast|jaldi|brief|short|ek line|tldr|summary|kya hai|what is|define|meaning|kitna|kaun|kab|where is|batao|bata/)) return 'flash';

  // FLASH for greetings/casual
  if (t.match(/^(hi|hello|hey|haan|okay|ok|thanks|shukriya|acha|theek|ha|nahi|no|yes).{0,20}$/)) return 'flash';

  // Length heuristic — long thoughtful questions → think
  if (text.length > 120) return 'think';

  return 'flash'; // Default to flash (faster) instead of auto
}

export function generateSessionTitle(messages: Array<{role:string;content:string}>): string {
  const first = messages.find(m => m.role === 'user')?.content || '';
  return first.slice(0, 40) + (first.length > 40 ? '...' : '') || 'Naya Chat';
}

export function quickTitle(text: string): string {
  return text.slice(0, 35) + (text.length > 35 ? '...' : '');
}

export function getSystemPrompt(
  personality: PersonalityMode | string,
  profile: any,
  memories: string[],
  emotion: string,
  hour: number,
  toolResults?: string[]
): string {
  const name = profile?.name || 'Bhai';
  const dynPrompts = buildPrompts(name);
  const p = dynPrompts[personality as PersonalityMode] || dynPrompts.default;
  const timeCtx = hour < 6 ? 'Raat (late)' : hour < 12 ? 'Subah' : hour < 17 ? 'Dopahar' : hour < 21 ? 'Shaam' : 'Raat';

  const emotionCtx: Record<string, string> = {
    sad:        'User thoda sad lag raha hai — extra supportive aur empathetic reh.',
    frustrated: 'User frustrated hai — calm, solution-focused reh.',
    happy:      'User khush hai — match their energy!',
    anxious:    'User nervous/anxious hai — reassuring aur grounding reh.',
    stressed:   'User stressed hai — practical help aur reassurance de.',
    bored:      'User bored hai — engaging, interesting content de.',
    proud:      'User ne kuch achieve kiya — uski achievement celebrate karo!',
    confused:   'User confused hai — step-by-step clearly samjhao.',
    romantic:   'User romantic mood mein hai — warm aur sweet reh.',
  };

  const locationStr = profile?.location ? `, ${profile.location}` : '';
  const goalStr = profile?.goal ? ` | Goal: ${profile.goal}` : '';
  const ageStr = profile?.age ? ` | Age: ${profile.age}` : '';
  let sys = p + '\n\nUser: ' + name + '. Time: ' + timeCtx + ' IST' + locationStr + goalStr + ageStr + '.';

  if (emotion !== 'neutral' && emotionCtx[emotion]) {
    sys += '\n\nContext: ' + emotionCtx[emotion];
  }

  if (profile?.customInstructions) {
    sys += '\n\nUser ki custom instructions: ' + profile.customInstructions;
  }

  if (memories.length > 0) {
    sys += '\n\n**User ke baare mein yaad hai:**\n' + memories.slice(0, 15).map(m => '- ' + m).join('\n');
  }

  if (toolResults && toolResults.length > 0) {
    sys += '\n\n**Real-time Data (tools se mila):**\n' + toolResults.join('\n\n');
    sys += '\n\nYeh tool data use karke answer de. Data ko natural conversation mein weave kar.';
  }

  sys += '\n\nRules:\n- Hinglish preferred (English + Hindi mix)\n- Concise but complete\n- Never say "As an AI..." — tu JARVIS hai\n- Tool data agar hai toh use it, fabricate mat kar\n- Markdown formatting use kar (bold, bullets, code blocks)\n- Agar user ki baat samajh nahi aya toh puchh lo';

  return sys;
}

export function keywordFallback(query: string): string {
  const q = query.toLowerCase();
  const hour = new Date().getHours();
  const greet = hour < 6 ? 'Raat' : hour < 12 ? 'Subah' : hour < 17 ? 'Dopahar' : hour < 21 ? 'Shaam' : 'Raat';
  if (q.match(/hello|hi|hey|namaste|hii|helo/)) return greet + ' Bhai! Main JARVIS hoon — kya help chahiye?';
  if (q.match(/how are|kaise ho|kaisa|kaisi/)) return 'Main ekdum mast hoon Bhai! Tum batao — kya chal raha hai?';
  if (q.match(/time|kitne baje|time kya hai/)) {
    return 'Abhi ' + new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' ho rahi hai (IST)';
  }
  if (q.match(/date|aaj kya|today|tarikh/)) {
    return 'Aaj ' + new Date().toLocaleDateString('hi-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' }) + ' hai';
  }
  if (q.match(/thanks|shukriya|dhanyawad|thank you/)) return 'Koi baat nahi Bhai! Sada tumhari seva mein 🙏';
  if (q.match(/bye|alvida|baad mein|ok bye/)) return 'Alvida Bhai! Agar kuch chahiye toh bulana 👋';
  if (q.match(/joke|mazak|funny/)) return '😄 Ek teacher ne student se pucha: "Tumhara future kya hai?" Student: "Sir, abhi present bhi clear nahi hai!"';
  return 'Main samjha nahi bhai. Thoda aur detail mein batao?';
}

// ── v45 NEW: Smart personality suggester ─────────────────────────
export function suggestPersonality(text: string): PersonalityMode | null {
  const t = text.toLowerCase();
  if (t.match(/depress|sad|lonely|anxious|mental/)) return 'therapist';
  if (t.match(/workout|gym|fitness|diet|lose weight/)) return 'fitness';
  if (t.match(/recipe|cook|khana|banana/)) return 'chef';
  if (t.match(/career|job|resume|interview/)) return 'career';
  if (t.match(/debate|argue|pros cons|opinion/)) return 'debate';
  if (t.match(/story|poem|creative|write|script/)) return 'creative';
  if (t.match(/neet|jee|exam|study/)) return 'study';
  if (t.match(/code|debug|programming|error/)) return 'code';
  return null;
}
